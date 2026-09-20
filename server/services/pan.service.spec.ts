import { afterEach, describe, expect, it, vi } from "vitest";
import { verifyPan } from "./pan.service";

describe("PAN verification service", () => {
  afterEach(() => {
    delete process.env.MOCK_MODE;
    delete process.env.PAN_VERIFICATION_URL;
    delete process.env.PAN_CLIENT_ID;
    delete process.env.PAN_CLIENT_CERTIFICATE;
    delete process.env.PAN_CLIENT_KEY_ID;
    vi.restoreAllMocks();
  });

  it("rejects an invalid PAN before making an upstream request", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch");

    await expect(
      verifyPan({ panNumber: "invalid", entityType: "INDIVIDUAL" }),
    ).rejects.toMatchObject({ code: "INVALID_PAN", statusCode: 400 });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("returns a mock identity without calling CBDT", async () => {
    process.env.MOCK_MODE = "true";

    await expect(
      verifyPan({ panNumber: "ABCDE1234F", entityType: "COMPANY" }),
    ).resolves.toMatchObject({
      panNumber: "ABCDE1234F",
      entityType: "COMPANY",
      validityStatus: "VALID",
      fullNameMatch: true,
      category: "COMPANY",
    });
  });

  it("sends entity type and certificate authentication headers", async () => {
    process.env.PAN_VERIFICATION_URL = "https://cbdt.example/verify";
    process.env.PAN_CLIENT_ID = "client-id";
    process.env.PAN_CLIENT_CERTIFICATE = "certificate-reference";
    process.env.PAN_CLIENT_KEY_ID = "key-id";
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({
        data: {
          status: "VALID",
          nameMatch: "true",
          category: "COMPANY",
        },
      }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );

    await expect(
      verifyPan({ panNumber: "ABCDE1234F", entityType: "COMPANY" }),
    ).resolves.toMatchObject({
      validityStatus: "VALID",
      fullNameMatch: true,
      category: "COMPANY",
    });

    const [, request] = fetchMock.mock.calls[0] ?? [];
    const headers = request?.headers as Record<string, string>;
    expect(headers["x-client-id"]).toBe("client-id");
    expect(headers["x-client-certificate"]).toBe("certificate-reference");
    expect(headers["x-client-key-id"]).toBe("key-id");
    expect(JSON.parse(String(request?.body))).toEqual({
      panNumber: "ABCDE1234F",
      entityType: "COMPANY",
    });
  });

  it("returns a structured name mismatch error", async () => {
    process.env.PAN_VERIFICATION_URL = "https://cbdt.example/verify";
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({
        validityStatus: "VALID",
        fullNameMatch: false,
        category: "INDIVIDUAL",
      }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );

    await expect(
      verifyPan({ panNumber: "ABCDE1234F", entityType: "INDIVIDUAL" }),
    ).rejects.toMatchObject({
      code: "PAN_NAME_MISMATCH",
      statusCode: 422,
    });
  });
});
