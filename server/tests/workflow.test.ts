import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { createServer } from "../app";
import { prisma } from "../lib/prisma";
import { Server as HTTPServer } from "node:http";
import { io as Client, Socket as ClientSocket } from "socket.io-client";
import { AddressInfo } from "node:net";

describe("E2E Workflow: Registration -> Application -> Admin Approval -> Socket", () => {
  let app: any;
  let httpServer: HTTPServer;
  let ioServer: any;
  let clientSocket: ClientSocket;
  let serverPort: number;

  const randomString = Math.random().toString(36).substring(7);
  const getMobile = (suffix: string) => `99${Date.now().toString().slice(-6)}${suffix}`;

  const testUser = {
    stakeholder: {
      email: `stk_${randomString}@test.com`,
      mobile: getMobile("11"),
      pan: "ABCDE1234F"
    },
    admin: {
      email: `adm_${randomString}@test.com`,
      mobile: getMobile("22")
    },
    lmo: {
      email: `lmo_${randomString}@test.com`,
      mobile: getMobile("33")
    },
  };

  const tokens = { stakeholder: "", admin: "" };
  
  let lmoId = "";
  let stakeholderId = "";
  let createdAppId = "";

  beforeAll(async () => {
    const serverInstance = createServer();
    app = serverInstance.app;
    httpServer = serverInstance.httpServer;
    ioServer = serverInstance.io;

    await new Promise<void>((resolve) => {
      httpServer.listen(0, () => {
        serverPort = (httpServer.address() as AddressInfo).port;
        clientSocket = Client(`http://localhost:${serverPort}`);
        clientSocket.on("connect", () => resolve());
      });
    });
  });

  afterAll(async () => {
    if (clientSocket?.connected) clientSocket.disconnect();
    await new Promise<void>((resolve) => {
      ioServer.close();
      httpServer.close(() => resolve());
    });
  });

  it("should register a Stakeholder user", async () => {
    const res = await request(app)
      .post("/api/v1/auth/register")
      .send({
        email: testUser.stakeholder.email,
        mobile: testUser.stakeholder.mobile,
        fullName: "Test Stakeholder",
        password: "password123",
        role: "STAKEHOLDER",
        pan: testUser.stakeholder.pan,
        businessName: "Test Business",
        businessAddress: "Test Address",
        jurisdictionState: "UP",
        jurisdictionDistrict: "Lucknow",
      });
    expect(res.status).toBe(201);

    await prisma.user.update({
      where: { mobile: testUser.stakeholder.mobile },
      data: { isActive: true }
    });

    const loginRes = await request(app)
      .post("/api/v1/auth/login")
      .send({
        mobile: testUser.stakeholder.mobile,
        password: "password123",
        role: "business",
      });
    expect(loginRes.status).toBe(200);
    tokens.stakeholder = loginRes.body.data.token;
    stakeholderId = loginRes.body.data.userId;
  });

  it("should register an Admin user", async () => {
    const res = await request(app)
      .post("/api/v1/auth/register")
      .send({
        email: testUser.admin.email,
        mobile: testUser.admin.mobile,
        fullName: "Test Admin",
        password: "password123",
        role: "ADMIN",
        employeeId: "ADM-123",
        jurisdictionState: "UP",
        jurisdictionDistrict: "Lucknow",
      });
    expect(res.status).toBe(201);

    await prisma.user.update({
      where: { mobile: testUser.admin.mobile },
      data: { isActive: true }
    });

    const loginRes = await request(app)
      .post("/api/v1/auth/login")
      .send({
        mobile: testUser.admin.mobile,
        password: "password123",
        role: "admin",
      });
    expect(loginRes.status).toBe(200);
    tokens.admin = loginRes.body.data.token;
  });

  it("should register an LMO user", async () => {
    const res = await request(app)
      .post("/api/v1/auth/register")
      .send({
        email: testUser.lmo.email,
        mobile: testUser.lmo.mobile,
        fullName: "Test LMO",
        password: "password123",
        role: "LMO",
        employeeId: `LMO-${randomString}`,
        jurisdictionState: "UP",
        jurisdictionDistrict: "Lucknow",
      });
    expect(res.status).toBe(201);


    await prisma.user.update({
      where: { mobile: testUser.lmo.mobile },
      data: { isActive: true }
    });

    const lmoUser = await prisma.user.findUnique({ where: { mobile: testUser.lmo.mobile } });
    await prisma.lmoOfficer.create({
      data: {
        employee_id: `LMO-${randomString}`,
        user: { connect: { user_id: lmoUser!.user_id } },
        state: { connect: { state_code: "UP" } }
      }
    });


    const loginRes = await request(app)
      .post("/api/v1/auth/login/lmo")
      .send({
        employeeId: `LMO-${randomString}`,
        password: "password123",
      });
    expect(loginRes.status).toBe(200);
    lmoId = loginRes.body.data.userId;
  });

  it("should create a new verification application via socket", async () => {
    expect(stakeholderId).toBeTruthy();

    // Have the LMO join early to verify they DO NOT get the message yet
    clientSocket.emit("join_officer_room", { userId: lmoId });
    let prematureRouting = false;
    const prematureListener = () => { prematureRouting = true; };
    clientSocket.on("route:assigned", prematureListener);

    clientSocket.emit("data", {
      appType: "INITIAL",
      categoryCode: "TEST-CAT",
      instrumentSubCategory: "Test Inst",
      modelNo: "MOD-1",
      manufacturerName: "Test Mfg",
      instrumentSerialNumber: `SN-${Date.now()}`,
      metric: "kg",
      paymentMethod: "UPI",
      userId: stakeholderId,
      stateCode: "UP",
      district: "Lucknow",
      pincode: 226001,
      address: "Test Address",
    });

    const response = await new Promise<any>((resolve) => {
      clientSocket.once("verification_persisted", resolve);
      clientSocket.once("verification_persistence_failed", resolve);
    });

    expect(response.success).toBe(true);
    expect(response.applicationId).toBeDefined();
    createdAppId = response.applicationId;

    // Wait a brief moment to ensure no socket event was fired to the LMO
    await new Promise(r => setTimeout(r, 500));
    expect(prematureRouting).toBe(false); // VERIFY NO PREMATURE SOCKET

    clientSocket.off("route:assigned", prematureListener);
  });

  it("should approve the application via Admin Pendency and trigger route_assigned socket", async () => {
    let socketFired = false;
    
    clientSocket.on("route:assigned", () => {
      socketFired = true;
    });

    const res = await request(app)
      .patch(`/api/admin/pendency/${createdAppId}/approve-route`)
      .set("Authorization", `Bearer ${tokens.admin}`)
      .send({
        lmoId: lmoId,
      });

    if (res.status !== 200) console.log("Approve Route error", res.body);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    await new Promise(r => setTimeout(r, 1000));
    expect(socketFired).toBe(true);
  });
});
