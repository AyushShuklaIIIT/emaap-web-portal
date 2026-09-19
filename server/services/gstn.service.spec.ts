import { afterEach, describe, expect, it, vi } from "vitest";
import { GstnVerificationError, verifyGstin } from "./gstn.service";

describe("GSTN verification service", () => {
  afterEach(() => {
    delete process.env.MOCK_MODE;
    delete process.env.GSTN_VERIFICATION_URL;
    vi.restoreAllMocks();
  });

  it("rejects malformed GSTINs before dispatch", async () => {
    await expect(verifyGstin({ gstin: "not-a-gstin" })).rejects.toMatchObject({
      code: "INVALID_GSTIN",
      statusCode: 400,
    });
  });

  it("returns a normalized sandbox identity in mock mode", async () => {
    process.env.MOCK_MODE = "true";

    await expect(verifyGstin({ gstin: "09ABCDE1234F1Z5" })).resolves.toMatchObject({
      gstin: "09ABCDE1234F1Z5",
      legalName: "eMaap Sandbox Business",
      tradeName: "eMaap Sandbox",
      taxpayerType: "REGULAR",
      activeStatus: "ACTIVE",
      stateCode: "09",
    });
  });

  it("maps an upstream response into the normalized business identity", async () => {
    process.env.GSTN_VERIFICATION_URL = "https://gstn.example/verify";
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify({
      data: {
        lgnm: "Example Legal Private Limited",
        tradeNam: "Example Retail",
        dty: "REGULAR",
        sts: "Active",
        stcd: "27",
        pradr: {
          bno: "10",
          loc: "Andheri",
          dst: "Mumbai Suburban",
          stcd: "27",
          pncd: "400001",
        },
      },
    }), {
      status: 200,
      headers: { "content-type": "application/json" },
    }));

    await expect(verifyGstin({ gstin: "27ABCDE1234F1Z5" })).resolves.toMatchObject({
      legalName: "Example Legal Private Limited",
      tradeName: "Example Retail",
      taxpayerType: "REGULAR",
      activeStatus: "ACTIVE",
      address: {
        buildingNumber: "10",
        location: "Andheri",
        district: "Mumbai Suburban",
        pincode: "400001",
      },
      stateCode: "27",
    });
  });

  it("returns a structured error for suspended registrations", async () => {
    process.env.GSTN_VERIFICATION_URL = "https://gstn.example/verify";
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify({
      legalName: "Suspended Business",
      status: "Suspended",
      stateCode: "09",
    }), {
      status: 200,
      headers: { "content-type": "application/json" },
    }));

    await expect(verifyGstin({ gstin: "09ABCDE1234F1Z5" })).rejects.toMatchObject({
        code: "SUSPENDED_GSTIN",
        statusCode: 422,
      });
  });
});
