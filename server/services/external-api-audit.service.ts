import { createHash } from "node:crypto";
import type { Prisma } from "../generated/prisma/client";

export interface ExternalApiAuditInput {
  providerName: string;
  endpoint: string;
  requestPayload: unknown;
  responsePayload: unknown;
  statusCode: number;
  latencyMs: number;
  userId?: string;
}

const SENSITIVE_KEY_PATTERN =
  /aadhaar|aadhar|pan|gstin|token|authorization|api[-_]?key|private[-_]?key|secret|password|credential/i;
const AADHAAR_PATTERN = /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g;
const BEARER_PATTERN = /\bBearer\s+[A-Za-z0-9._~+/=-]+\b/gi;
const PRIVATE_KEY_PATTERN =
  /-----BEGIN [^-]+ PRIVATE KEY-----[\s\S]*?-----END [^-]+ PRIVATE KEY-----/g;
const MASKED_VALUE = "[REDACTED]";

type SanitizedJson = Prisma.InputJsonValue;

function sanitizeValue(value: unknown, seen: WeakSet<object>): SanitizedJson {
  if (typeof value === "string") {
    return value
      .replace(AADHAAR_PATTERN, MASKED_VALUE)
      .replace(BEARER_PATTERN, `Bearer ${MASKED_VALUE}`)
      .replace(PRIVATE_KEY_PATTERN, MASKED_VALUE);
  }

  if (typeof value === "bigint") return value.toString();
  if (value instanceof Date) return value.toISOString();

  if (Array.isArray(value)) {
    return value.map((item) => sanitizeValue(item, seen));
  }

  if (value && typeof value === "object") {
    if (seen.has(value)) return "[Circular]";
    seen.add(value);

    const sanitized: Record<string, Prisma.InputJsonValue> = {};
    for (const [key, nestedValue] of Object.entries(value)) {
      sanitized[key] = SENSITIVE_KEY_PATTERN.test(key)
        ? MASKED_VALUE
        : sanitizeValue(nestedValue, seen);
    }
    return sanitized;
  }

  return value === undefined ? null : (value as Prisma.InputJsonValue);
}

export function sanitizeAuditPayload(payload: unknown): SanitizedJson {
  return sanitizeValue(payload, new WeakSet<object>());
}

function sanitizeEndpoint(endpoint: string): string {
  try {
    const url = new URL(endpoint);
    for (const key of [...url.searchParams.keys()]) {
      if (SENSITIVE_KEY_PATTERN.test(key)) {
        url.searchParams.set(key, MASKED_VALUE);
      }
    }
    return url.toString();
  } catch {
    return sanitizeAuditPayload(endpoint) as string;
  }
}

function stableJson(value: unknown): string {
  return JSON.stringify(value) ?? "null";
}

export function hashAuditPayload(
  requestPayload: unknown,
  responsePayload: unknown,
): string {
  const sanitizedPayload = {
    request: sanitizeAuditPayload(requestPayload),
    response: sanitizeAuditPayload(responsePayload),
  };
  return createHash("sha256").update(stableJson(sanitizedPayload)).digest("hex");
}

export async function logExternalApiCall(
  input: ExternalApiAuditInput,
): Promise<string | null> {
  try {
    const requestPayload = sanitizeAuditPayload(input.requestPayload);
    const responsePayload = sanitizeAuditPayload(input.responsePayload);
    const payloadSha256 = createHash("sha256")
      .update(stableJson({ request: requestPayload, response: responsePayload }))
      .digest("hex");
    const endpoint = sanitizeEndpoint(input.endpoint);
    const { prisma } = await import("../lib/prisma");
    const record = await prisma.externalApiAuditLog.create({
      data: {
        provider_name: input.providerName,
        endpoint,
        request_payload: requestPayload,
        response_payload: responsePayload,
        status_code: input.statusCode,
        latency_ms: Math.max(0, Math.round(input.latencyMs)),
        user_id: input.userId,
        payload_sha256: payloadSha256,
      },
      select: { audit_id: true },
    });
    return record.audit_id;
  } catch (error) {
    console.error("Failed to persist external API audit log", error);
    return null;
  }
}
