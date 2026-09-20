import { randomUUID } from "node:crypto";
import { logExternalApiCall } from "./external-api-audit.service";

export const PAN_PATTERN = /^[A-Z]{5}\d{4}[A-Z]$/;

export type PanEntityType = "INDIVIDUAL" | "COMPANY";
export type PanValidityStatus = "VALID" | "INVALID" | "UNKNOWN";

export interface PanVerificationInput {
  panNumber: string;
  entityType: PanEntityType;
  userId?: string;
}

export interface PanIdentityResult {
  panNumber: string;
  entityType: PanEntityType;
  validityStatus: PanValidityStatus;
  fullNameMatch: boolean;
  category: string;
  verifiedAt: string;
}

export class PanVerificationError extends Error {
  constructor(
    message: string,
    readonly code:
      | "INVALID_PAN"
      | "INVALID_ENTITY_TYPE"
      | "PAN_NOT_FOUND"
      | "PAN_NAME_MISMATCH"
      | "UPSTREAM_ERROR"
      | "INVALID_UPSTREAM_RESPONSE",
    readonly statusCode: number,
  ) {
    super(message);
    this.name = "PanVerificationError";
  }
}

function isMockMode(): boolean {
  return process.env.MOCK_MODE?.toLowerCase() === "true";
}

function normalizePan(panNumber: string): string {
  const pan = panNumber.replace(/\s/g, "").toUpperCase();
  if (!PAN_PATTERN.test(pan)) {
    throw new PanVerificationError(
      "PAN must be a valid 10-character identifier",
      "INVALID_PAN",
      400,
    );
  }
  return pan;
}

function normalizeEntityType(entityType: string): PanEntityType {
  const normalized = entityType.toUpperCase();
  if (normalized !== "INDIVIDUAL" && normalized !== "COMPANY") {
    throw new PanVerificationError(
      "Entity type must be INDIVIDUAL or COMPANY",
      "INVALID_ENTITY_TYPE",
      400,
    );
  }
  return normalized;
}

function objectValue(value: unknown): Record<string, unknown> {
  return value && typeof value === "object"
    ? (value as Record<string, unknown>)
    : {};
}

function stringValue(...values: unknown[]): string {
  return values.find((value): value is string => typeof value === "string") ?? "";
}

function booleanValue(...values: unknown[]): boolean | undefined {
  for (const value of values) {
    if (typeof value === "boolean") return value;
    if (typeof value === "string") {
      if (["true", "yes", "y", "valid", "matched"].includes(value.toLowerCase())) return true;
      if (["false", "no", "n", "invalid", "mismatch"].includes(value.toLowerCase())) return false;
    }
  }
  return undefined;
}

function normalizeStatus(...values: unknown[]): PanValidityStatus {
  const status = String(values.find((value) => value !== undefined) ?? "")
    .trim()
    .toUpperCase();
  if (["VALID", "ACTIVE", "Y", "SUCCESS"].includes(status)) return "VALID";
  if (["INVALID", "INACTIVE", "N", "FAILURE"].includes(status)) return "INVALID";
  return "UNKNOWN";
}

function normalizeResponse(
  panNumber: string,
  entityType: PanEntityType,
  payload: unknown,
): PanIdentityResult {
  const root = objectValue(payload);
  const data = objectValue(root.data ?? root.result ?? root);
  const validityStatus = normalizeStatus(
    data.validityStatus,
    data.status,
    data.panStatus,
    root.status,
  );
  const fullNameMatch =
    booleanValue(
      data.fullNameMatch,
      data.nameMatch,
      data.name_match,
      root.fullNameMatch,
    ) ?? validityStatus === "VALID";

  if (validityStatus === "UNKNOWN" || !stringValue(data.category, data.panCategory, data.categoryCode)) {
    throw new PanVerificationError(
      "CBDT returned an incomplete PAN identity",
      "INVALID_UPSTREAM_RESPONSE",
      502,
    );
  }

  return {
    panNumber,
    entityType,
    validityStatus,
    fullNameMatch,
    category: stringValue(data.category, data.panCategory, data.categoryCode),
    verifiedAt: new Date().toISOString(),
  };
}

function mockResponse(
  panNumber: string,
  entityType: PanEntityType,
): PanIdentityResult {
  return {
    panNumber,
    entityType,
    validityStatus: "VALID",
    fullNameMatch: true,
    category: entityType === "COMPANY" ? "COMPANY" : "INDIVIDUAL",
    verifiedAt: new Date().toISOString(),
  };
}

function getRequiredEndpoint(): string {
  const endpoint = process.env.PAN_VERIFICATION_URL;
  if (!endpoint) {
    throw new PanVerificationError(
      "PAN verification service is not configured",
      "UPSTREAM_ERROR",
      503,
    );
  }
  return endpoint;
}

function getClientHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    "content-type": "application/json",
    accept: "application/json",
    "x-correlation-id": randomUUID(),
  };
  if (process.env.PAN_CLIENT_ID) headers["x-client-id"] = process.env.PAN_CLIENT_ID;
  if (process.env.PAN_CLIENT_CERTIFICATE) {
    headers["x-client-certificate"] = process.env.PAN_CLIENT_CERTIFICATE;
  }
  if (process.env.PAN_CLIENT_KEY_ID) headers["x-client-key-id"] = process.env.PAN_CLIENT_KEY_ID;
  return headers;
}

export async function verifyPan(
  input: PanVerificationInput,
): Promise<PanIdentityResult> {
  const panNumber = normalizePan(input.panNumber);
  const entityType = normalizeEntityType(input.entityType);
  if (isMockMode()) return mockResponse(panNumber, entityType);

  const endpoint = getRequiredEndpoint();
  const startedAt = Date.now();
  const headers = getClientHeaders();
  let result: PanIdentityResult | undefined;
  let statusCode = 502;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30_000);
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers,
        body: JSON.stringify({ panNumber, entityType }),
        signal: controller.signal,
      });
      statusCode = response.status;
      const payload = await response.json().catch(() => null);
      if (!response.ok || !payload) {
        throw new PanVerificationError(
          `PAN verification failed with status ${response.status}`,
          "UPSTREAM_ERROR",
          response.status >= 400 && response.status < 500 ? 422 : 502,
        );
      }
      result = normalizeResponse(panNumber, entityType, payload);
      if (result.validityStatus === "INVALID") {
        throw new PanVerificationError("PAN was not found or is invalid", "PAN_NOT_FOUND", 422);
      }
      if (!result.fullNameMatch) {
        throw new PanVerificationError("PAN holder name did not match", "PAN_NAME_MISMATCH", 422);
      }
      return result;
    } finally {
      clearTimeout(timeout);
    }
  } catch (error) {
    if (error instanceof PanVerificationError) throw error;
    throw new PanVerificationError(
      error instanceof DOMException && error.name === "AbortError"
        ? "PAN verification request timed out"
        : "PAN verification request failed",
      "UPSTREAM_ERROR",
      502,
    );
  } finally {
    void logExternalApiCall({
      providerName: "CBDT",
      endpoint,
      requestPayload: { panNumber, entityType },
      responsePayload: result ?? { error: "verification failed" },
      statusCode,
      latencyMs: Date.now() - startedAt,
      userId: input.userId,
    });
  }
}
