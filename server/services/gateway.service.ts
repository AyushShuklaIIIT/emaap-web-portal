import { randomUUID } from "node:crypto";
import type { GatewayProxyRequest, GatewayResponse } from "@shared/api";
import { logExternalApiCall } from "./external-api-audit.service";

const DEFAULT_TIMEOUT_MS = 30_000;
const DEFAULT_ATTEMPTS = 3;
const MAX_ATTEMPTS = 3;
const FAILURE_THRESHOLD = 5;
const COOLDOWN_MS = 30_000;
const RETRYABLE_STATUS_CODES = new Set([502, 503, 504]);

interface CircuitState {
  consecutiveFailures: number;
  openedAt?: number;
  probeInFlight: boolean;
}

const circuits = new Map<string, CircuitState>();

const sleep = (delayMs: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, delayMs));

function getCircuitState(targetUrl: string): CircuitState {
  const existing = circuits.get(targetUrl);
  if (existing) return existing;

  const state: CircuitState = {
    consecutiveFailures: 0,
    probeInFlight: false,
  };
  circuits.set(targetUrl, state);
  return state;
}

function isCircuitOpen(state: CircuitState): boolean {
  if (!state.openedAt) return false;
  if (Date.now() - state.openedAt < COOLDOWN_MS) return true;
  if (state.probeInFlight) return true;
  state.probeInFlight = true;
  return false;
}

function recordSuccess(state: CircuitState): void {
  state.consecutiveFailures = 0;
  state.openedAt = undefined;
  state.probeInFlight = false;
}

function recordFailure(state: CircuitState): void {
  state.probeInFlight = false;
  state.consecutiveFailures += 1;
  if (state.consecutiveFailures >= FAILURE_THRESHOLD) {
    state.openedAt = Date.now();
  }
}

function parseResponseData(response: Response): Promise<unknown> {
  const contentType = response.headers.get("content-type") ?? "";
  return contentType.includes("application/json")
    ? response.json().catch(() => null)
    : response.text();
}

function normalizeBody(body: unknown): BodyInit | undefined {
  if (body === undefined || body === null) return undefined;
  if (
    typeof body === "string" ||
    body instanceof Blob ||
    body instanceof ArrayBuffer ||
    ArrayBuffer.isView(body)
  ) {
    return body as BodyInit;
  }
  return JSON.stringify(body);
}

export async function proxyRequest(
  request: GatewayProxyRequest,
): Promise<GatewayResponse> {
  const correlationId = randomUUID();
  const startedAt = Date.now();
  const statusBase = {
    correlationId,
    data: null,
  };
  let target: URL;

  try {
    target = new URL(request.targetUrl);
    if (!["http:", "https:"].includes(target.protocol)) {
      throw new Error("Target URL must use HTTP or HTTPS");
    }
  } catch (error) {
    const result = {
      ...statusBase,
      success: false,
      statusCode: 400,
      error: error instanceof Error ? error.message : "Invalid target URL",
    };
    void logExternalApiCall({
      providerName: "invalid-target",
      endpoint: request.targetUrl,
      requestPayload: request,
      responsePayload: result,
      statusCode: result.statusCode,
      latencyMs: Date.now() - startedAt,
    });
    return result;
  }

  const circuit = getCircuitState(target.toString());
  if (isCircuitOpen(circuit)) {
    const result = {
      ...statusBase,
      success: false,
      statusCode: 503,
      error: "Circuit breaker is open for this target",
    };
    void logExternalApiCall({
      providerName: target.hostname,
      endpoint: target.toString(),
      requestPayload: request,
      responsePayload: result,
      statusCode: result.statusCode,
      latencyMs: Date.now() - startedAt,
    });
    return result;
  }

  const timeoutMs = Math.max(1, request.timeoutMs ?? DEFAULT_TIMEOUT_MS);
  const attempts = Math.min(
    MAX_ATTEMPTS,
    Math.max(1, request.retryCount ?? DEFAULT_ATTEMPTS),
  );
  const headers = new Headers(request.headers);
  headers.set("x-correlation-id", correlationId);
  if (request.body !== undefined && !headers.has("content-type")) {
    headers.set("content-type", "application/json");
  }

  let lastError = "Gateway request failed";
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(target, {
        method: request.method ?? "GET",
        headers,
        body: normalizeBody(request.body),
        signal: controller.signal,
      });
      const data = await parseResponseData(response);

      if (RETRYABLE_STATUS_CODES.has(response.status)) {
        lastError = `Upstream request returned ${response.status}`;
        if (attempt < attempts - 1) {
          await sleep(2 ** attempt * 100);
          continue;
        }
        recordFailure(circuit);
        const result = {
          correlationId,
          success: false,
          statusCode: response.status,
          data,
          error: lastError,
        };
        void logExternalApiCall({
          providerName: target.hostname,
          endpoint: target.toString(),
          requestPayload: request,
          responsePayload: result,
          statusCode: result.statusCode,
          latencyMs: Date.now() - startedAt,
        });
        return result;
      }

      recordSuccess(circuit);
      const result = {
        correlationId,
        success: response.ok,
        statusCode: response.status,
        data,
        ...(response.ok ? {} : { error: `Upstream request returned ${response.status}` }),
      };
      void logExternalApiCall({
        providerName: target.hostname,
        endpoint: target.toString(),
        requestPayload: request,
        responsePayload: result,
        statusCode: result.statusCode,
        latencyMs: Date.now() - startedAt,
      });
      return result;
    } catch (error) {
      lastError =
        error instanceof DOMException && error.name === "AbortError"
          ? "Gateway request timed out"
          : error instanceof Error
            ? error.message
            : "Gateway request failed";
      if (attempt < attempts - 1) {
        await sleep(2 ** attempt * 100);
        continue;
      }
      recordFailure(circuit);
      const result = {
        ...statusBase,
        success: false,
        statusCode: 504,
        error: lastError,
      };
      void logExternalApiCall({
        providerName: target.hostname,
        endpoint: target.toString(),
        requestPayload: request,
        responsePayload: result,
        statusCode: result.statusCode,
        latencyMs: Date.now() - startedAt,
      });
      return result;
    } finally {
      clearTimeout(timeout);
    }
  }

  recordFailure(circuit);
  const result = { ...statusBase, success: false, statusCode: 504, error: lastError };
  void logExternalApiCall({
    providerName: target.hostname,
    endpoint: target.toString(),
    requestPayload: request,
    responsePayload: result,
    statusCode: result.statusCode,
    latencyMs: Date.now() - startedAt,
  });
  return result;
}

export function resetGatewayState(): void {
  circuits.clear();
}
