import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { createServer } from "../app";
import { prisma } from "../lib/prisma";

describe("Authentication: Login functionality for all user types", () => {
  let app: any;

  const randomSuffix = Math.random().toString(36).substring(7);
  const getMobile = (prefix: string) => `${prefix}${Date.now().toString().slice(-8)}`;

  const testUsers = {
    stakeholder: {
      email: `stk_${randomSuffix}@test.com`,
      mobile: getMobile("91"),
      pan: "ABCDE1234F"
    },
    admin: {
      email: `adm_${randomSuffix}@test.com`,
      mobile: getMobile("92")
    },
    lmo: {
      email: `lmo_${randomSuffix}@test.com`,
      mobile: getMobile("93"),
      employeeId: `LMO-${randomSuffix}`
    },
    gatc: {
      email: `gatc_${randomSuffix}@test.com`,
      mobile: getMobile("94"),
    }
  };

  beforeAll(() => {
    const serverInstance = createServer();
    app = serverInstance.app;
  });

  describe("Stakeholder (Business User)", () => {
    it("should successfully register and login", async () => {
      // 1. Register
      const regRes = await request(app).post("/api/v1/auth/register").send({
        email: testUsers.stakeholder.email,
        mobile: testUsers.stakeholder.mobile,
        fullName: "Auth Stakeholder",
        password: "password123",
        role: "STAKEHOLDER",
        pan: testUsers.stakeholder.pan,
        businessName: "Auth Business",
        businessAddress: "123 Auth St",
        jurisdictionState: "UP",
        jurisdictionDistrict: "Lucknow",
      });
      expect(regRes.status).toBe(201);

      // 2. Activate user
      await prisma.user.update({
        where: { mobile: testUsers.stakeholder.mobile },
        data: { isActive: true }
      });

      // 3. Login
      const loginRes = await request(app).post("/api/v1/auth/login").send({
        mobile: testUsers.stakeholder.mobile,
        password: "password123",
        role: "business",
      });
      expect(loginRes.status).toBe(200);
      expect(loginRes.body.success).toBe(true);
      expect(loginRes.body.data.token).toBeDefined();
    });
  });

  describe("Central Admin", () => {
    it("should successfully register and login", async () => {
      // 1. Register
      const regRes = await request(app).post("/api/v1/auth/register").send({
        email: testUsers.admin.email,
        mobile: testUsers.admin.mobile,
        fullName: "Auth Admin",
        password: "password123",
        role: "ADMIN",
        employeeId: "ADM-999",
        jurisdictionState: "UP",
        jurisdictionDistrict: "Lucknow",
      });
      expect(regRes.status).toBe(201);

      // 2. Activate user
      await prisma.user.update({
        where: { mobile: testUsers.admin.mobile },
        data: { isActive: true }
      });

      // 3. Login
      const loginRes = await request(app).post("/api/v1/auth/login").send({
        mobile: testUsers.admin.mobile,
        password: "password123",
        role: "admin",
      });
      expect(loginRes.status).toBe(200);
      expect(loginRes.body.success).toBe(true);
      expect(loginRes.body.data.token).toBeDefined();
    });
  });

  describe("LMO Officer", () => {
    it("should successfully register and login via LMO endpoint", async () => {
      // 1. Register
      const regRes = await request(app).post("/api/v1/auth/register").send({
        email: testUsers.lmo.email,
        mobile: testUsers.lmo.mobile,
        fullName: "Auth LMO",
        password: "password123",
        role: "LMO",
        employeeId: testUsers.lmo.employeeId,
        jurisdictionState: "UP",
        jurisdictionDistrict: "Lucknow",
      });
      expect(regRes.status).toBe(201);

      // 2. Activate user and connect LMO Profile (needed for strict LMO relational checks)
      const lmoUser = await prisma.user.update({
        where: { mobile: testUsers.lmo.mobile },
        data: { isActive: true }
      });
      
      await prisma.lmoOfficer.create({
        data: {
          employee_id: testUsers.lmo.employeeId,
          user: { connect: { user_id: lmoUser.user_id } },
          state: { connect: { state_code: "UP" } }
        }
      });

      // 3. Login via specific LMO route
      const loginRes = await request(app).post("/api/v1/auth/login/lmo").send({
        employeeId: testUsers.lmo.employeeId,
        password: "password123",
      });
      expect(loginRes.status).toBe(200);
      expect(loginRes.body.success).toBe(true);
      expect(loginRes.body.data.token).toBeDefined();
    });
  });
  
  describe("GATC Principal", () => {
    it("should successfully register and login", async () => {
      // 1. Register
      const regRes = await request(app).post("/api/v1/auth/register").send({
        email: testUsers.gatc.email,
        mobile: testUsers.gatc.mobile,
        fullName: "Auth GATC",
        password: "password123",
        role: "GATC_PRINCIPAL",
        employeeId: `GATC-${randomSuffix}`,
        jurisdictionState: "UP",
        jurisdictionDistrict: "Lucknow",
      });
      expect(regRes.status).toBe(201);

      // 2. Activate user
      await prisma.user.update({
        where: { mobile: testUsers.gatc.mobile },
        data: { isActive: true }
      });

      // 3. Login
      const loginRes = await request(app).post("/api/v1/auth/login").send({
        mobile: testUsers.gatc.mobile,
        password: "password123",
        role: "gatc",
      });
      expect(loginRes.status).toBe(200);
      expect(loginRes.body.success).toBe(true);
      expect(loginRes.body.data.token).toBeDefined();
    });
  });
});
