import { describe, expect, it } from "vitest";
import { hashAuditPayload, sanitizeAuditPayload } from "./external-api-audit.service";

describe("external API audit payload protection", () => {
  it("masks sensitive keys and sensitive values recursively", () => {
    const sanitized = sanitizeAuditPayload({
      aadhaar: "1234 5678 9012",
      authorization: "Bearer very-secret-token",
      nested: {
        privateKey: "-----BEGIN PRIVATE KEY-----secret-----END PRIVATE KEY-----",
        message: "Aadhaar 123456789012 must not be stored",
      },
    });

    expect(sanitized).toEqual({
      aadhaar: "[REDACTED]",
      authorization: "[REDACTED]",
      nested: {
        privateKey: "[REDACTED]",
        message: "Aadhaar [REDACTED] must not be stored",
      },
    });
  });

  it("produces a deterministic SHA-256 hash of sanitized request and response", () => {
    const first = hashAuditPayload(
      { authorization: "Bearer first-token", value: 10 },
      { aadhaar: "123456789012", ok: true },
    );
    const second = hashAuditPayload(
      { authorization: "Bearer second-token", value: 10 },
      { aadhaar: "1234-5678-9012", ok: true },
    );

    expect(first).toMatch(/^[a-f0-9]{64}$/);
    expect(second).toBe(first);
  });
});
