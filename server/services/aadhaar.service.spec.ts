import { afterEach, describe, expect, it, vi } from "vitest";
import { generateKeyPairSync } from "node:crypto";
import {
  decryptForTest,
  generateAadhaarOtp,
  resetAadhaarTransactions,
  verifyAadhaarOtp,
} from "./aadhaar.service";

describe("Aadhaar gateway service", () => {
  afterEach(() => {
    delete process.env.MOCK_MODE;
    resetAadhaarTransactions();
  });

  it("generates a mock transaction with a masked Aadhaar", async () => {
    process.env.MOCK_MODE = "true";

    const result = await generateAadhaarOtp({ aadhaarNumber: "123456789012" });

    expect(result.txnId).toMatch(/^MOCK-/);
    expect(result.maskedAadhaar).toBe("XXXX-XXXX-9012");
  });

  it("verifies the sandbox OTP and returns a token", async () => {
    process.env.MOCK_MODE = "true";
    const { txnId } = await generateAadhaarOtp({ virtualId: "1234567890123456" });

    const result = await verifyAadhaarOtp({ txnId, otpCode: "123456" });

    expect(result).toMatchObject({
      status: "VERIFIED",
      maskedAadhaar: "XXXX-XXXX-3456",
    });
    expect(result.verificationToken).toMatch(/^[a-f0-9]{64}$/);
  });

  it("rejects an invalid OTP without exposing the identifier", async () => {
    process.env.MOCK_MODE = "true";
    const { txnId } = await generateAadhaarOtp({ aadhaarNumber: "123456789012" });

    const result = await verifyAadhaarOtp({ txnId, otpCode: "000000" });

    expect(result).toEqual({
      status: "FAILED",
      maskedAadhaar: "XXXX-XXXX-9012",
      error: "OTP verification failed",
    });
  });

  it("encrypts the identifier envelope before a production request", async () => {
    const { publicKey, privateKey } = generateKeyPairSync("rsa", {
      modulusLength: 2048,
    });
    process.env.UIDAI_RSA_PUBLIC_KEY = publicKey.export({ type: "spki", format: "pem" }).toString();
    process.env.UIDAI_GENERATE_OTP_URL = "https://uidai.example/generate";
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ txnId: "uidai-txn" }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );

    await generateAadhaarOtp({ aadhaarNumber: "123456789012" });

    const body = JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body));
    expect(decryptForTest(
      body,
      privateKey.export({ type: "pkcs8", format: "pem" }).toString(),
    )).toBe(JSON.stringify({ identifier: "123456789012" }));
  });
});
