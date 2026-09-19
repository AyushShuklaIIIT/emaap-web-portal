import { afterEach, describe, expect, it, vi } from "vitest";
import { proxyRequest, resetGatewayState } from "./gateway.service";

describe("proxyRequest", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
    resetGatewayState();
  });

  it("adds a correlation ID and retries retryable upstream responses", async () => {
    vi.useFakeTimers();
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ error: "busy" }), {
          status: 503,
          headers: { "content-type": "application/json" },
        }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
      );

    const resultPromise = proxyRequest({
      targetUrl: "https://example.com/resource",
      retryCount: 2,
    });
    await vi.advanceTimersByTimeAsync(100);
    const result = await resultPromise;

    expect(result.success).toBe(true);
    expect(result.statusCode).toBe(200);
    expect(result.data).toEqual({ ok: true });
    expect(result.correlationId).toMatch(/^[0-9a-f-]{36}$/);
    const requestHeaders = fetchMock.mock.calls[0]?.[1]?.headers as Headers;
    expect(requestHeaders.get("x-correlation-id")).toBe(result.correlationId);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("returns a standardized response for invalid URLs", async () => {
    const result = await proxyRequest({ targetUrl: "file:///private" });

    expect(result).toMatchObject({
      success: false,
      statusCode: 400,
      data: null,
      error: "Target URL must use HTTP or HTTPS",
    });
    expect(result.correlationId).toMatch(/^[0-9a-f-]{36}$/);
  });
});
