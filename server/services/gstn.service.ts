import { randomUUID } from "node:crypto";
import { logExternalApiCall } from "./external-api-audit.service";

export const GSTIN_PATTERN = /^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;

export interface GstnVerificationInput {
  gstin: string;
  userId?: string;
}

export interface GstnAddress {
  buildingName?: string;
  buildingNumber?: string;
  floorNumber?: string;
  street?: string;
  location?: string;
  district?: string;
  city?: string;
  state?: string;
  stateCode: string;
  pincode?: string;
}

export interface GstnBusinessIdentity {
  gstin: string;
  legalName: string;
  tradeName: string;
  taxpayerType: string;
  activeStatus: "ACTIVE" | "SUSPENDED" | "CANCELLED" | "UNKNOWN";
  address: GstnAddress;
  stateCode: string;
  verifiedAt: string;
}

export class GstnVerificationError extends Error {
  constructor(
    message: string,
    readonly code:
      | "INVALID_GSTIN"
      | "SUSPENDED_GSTIN"
      | "CANCELLED_GSTIN"
      | "UPSTREAM_ERROR"
      | "INVALID_UPSTREAM_RESPONSE",
    readonly statusCode: number,
  ) {
    super(message);
    this.name = "GstnVerificationError";
  }
}

function isMockMode(): boolean {
  return process.env.MOCK_MODE?.toLowerCase() === "true";
}

function normalizeGstin(gstin: string): string {
  const normalized = gstin.replace(/\s/g, "").toUpperCase();
  if (!GSTIN_PATTERN.test(normalized)) {
    throw new GstnVerificationError(
      "GSTIN must be a valid 15-character identifier",
      "INVALID_GSTIN",
      400,
    );
  }
  return normalized;
}

function getRequiredEndpoint(): string {
  const endpoint = process.env.GSTN_VERIFICATION_URL;
  if (!endpoint) {
    throw new GstnVerificationError(
      "GSTN verification service is not configured",
      "UPSTREAM_ERROR",
      503,
    );
  }
  return endpoint;
}

function stringValue(...values: unknown[]): string {
  return values.find((value): value is string => typeof value === "string") ?? "";
}

function objectValue(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? value as Record<string, unknown> : {};
}

function normalizeStatus(value: unknown): GstnBusinessIdentity["activeStatus"] {
  const status = String(value ?? "").trim().toUpperCase();
  if (["ACTIVE", "ACTIVATED", "VALID", "Y"].includes(status)) return "ACTIVE";
  if (["SUSPENDED", "SUSPEND"].includes(status)) return "SUSPENDED";
  if (["CANCELLED", "CANCELED", "CANCEL"].includes(status)) return "CANCELLED";
  return "UNKNOWN";
}

function normalizeResponse(gstin: string, payload: unknown): GstnBusinessIdentity {
  const root = objectValue(payload);
  const data = objectValue(root.data ?? root.result ?? root.taxpayer ?? root);
  const address = objectValue(
    data.principalPlaceOfBusiness ?? data.principalAddress ?? data.pradr ?? data.address,
  );
  const stateCode = stringValue(
    data.stateCode,
    data.state_code,
    address.stateCode,
    address.state_code,
    gstin.slice(0, 2),
  );
  const activeStatus = normalizeStatus(
    data.activeStatus ?? data.status ?? data.gstinStatus ?? data.sts ?? root.status,
  );
  const legalName = stringValue(
    data.legalName,
    data.legal_name,
    data.lgnm,
    data.taxpayerName,
  );
  const tradeName = stringValue(
    data.tradeName,
    data.trade_name,
    data.tradename,
    data.tradeNam,
    legalName,
  );

  if (!legalName || !stateCode) {
    throw new GstnVerificationError(
      "GSTN returned an incomplete business identity",
      "INVALID_UPSTREAM_RESPONSE",
      502,
    );
  }

  return {
    gstin,
    legalName,
    tradeName,
    taxpayerType: stringValue(
      data.taxpayerType,
      data.taxpayer_type,
      data.dty,
      "UNKNOWN",
    ),
    activeStatus,
    address: {
      buildingName: stringValue(address.buildingName, address.building_name) || undefined,
      buildingNumber: stringValue(address.buildingNumber, address.building_number, address.bno) || undefined,
      floorNumber: stringValue(address.floorNumber, address.floor_number, address.flno) || undefined,
      street: stringValue(address.street, address.st) || undefined,
      location: stringValue(address.location, address.loc) || undefined,
      district: stringValue(address.district, address.dst) || undefined,
      city: stringValue(address.city, address.cityName) || undefined,
      state: stringValue(address.state, address.stateName, address.stcd) || undefined,
      stateCode,
      pincode: stringValue(address.pincode, address.pinCode, address.pncd) || undefined,
    },
    stateCode,
    verifiedAt: new Date().toISOString(),
  };
}

function mockResponse(gstin: string): GstnBusinessIdentity {
  const stateCode = gstin.slice(0, 2);
  return {
    gstin,
    legalName: "eMaap Sandbox Business",
    tradeName: "eMaap Sandbox",
    taxpayerType: "REGULAR",
    activeStatus: "ACTIVE",
    address: {
      state: "Sandbox State",
      stateCode,
      district: "Sandbox District",
      pincode: "000000",
    },
    stateCode,
    verifiedAt: new Date().toISOString(),
  };
}

export async function verifyGstin(
  input: GstnVerificationInput,
): Promise<GstnBusinessIdentity> {
  const gstin = normalizeGstin(input.gstin);
  if (isMockMode()) return mockResponse(gstin);

  const endpoint = getRequiredEndpoint();
  const correlationId = randomUUID();
  const startedAt = Date.now();
  let result: GstnBusinessIdentity | undefined;
  let statusCode = 502;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30_000);
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "accept": "application/json",
          "x-correlation-id": correlationId,
        },
        body: JSON.stringify({ gstin }),
        signal: controller.signal,
      });
      statusCode = response.status;
      const payload = await response.json().catch(() => null);
      if (!response.ok || !payload) {
        throw new GstnVerificationError(
          `GSTN verification failed with status ${response.status}`,
          "UPSTREAM_ERROR",
          response.status >= 400 && response.status < 500 ? 422 : 502,
        );
      }
      result = normalizeResponse(gstin, payload);
      if (result.activeStatus === "SUSPENDED") {
        throw new GstnVerificationError("GSTIN is suspended", "SUSPENDED_GSTIN", 422);
      }
      if (result.activeStatus === "CANCELLED") {
        throw new GstnVerificationError("GSTIN is cancelled", "CANCELLED_GSTIN", 422);
      }
      return result;
    } finally {
      clearTimeout(timeout);
    }
  } catch (error) {
    if (error instanceof GstnVerificationError) throw error;
    throw new GstnVerificationError(
      error instanceof DOMException && error.name === "AbortError"
        ? "GSTN verification request timed out"
        : "GSTN verification request failed",
      "UPSTREAM_ERROR",
      502,
    );
  } finally {
    void logExternalApiCall({
      providerName: "GSTN",
      endpoint,
      requestPayload: { gstin },
      responsePayload: result ?? { error: "verification failed" },
      statusCode,
      latencyMs: Date.now() - startedAt,
      userId: input.userId,
    });
  }
}
