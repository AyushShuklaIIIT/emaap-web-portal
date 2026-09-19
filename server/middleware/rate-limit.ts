import type { RequestHandler } from "express";

interface ClientWindow {
  count: number;
  startedAt: number;
}

export function createRateLimiter(
  limit = 60,
  windowMs = 60_000,
): RequestHandler {
  const clients = new Map<string, ClientWindow>();

  return (req, res, next) => {
    const clientKey = req.ip ?? req.socket.remoteAddress ?? "unknown";
    const now = Date.now();
    const current = clients.get(clientKey);

    if (!current || now - current.startedAt >= windowMs) {
      clients.set(clientKey, { count: 1, startedAt: now });
      return next();
    }

    current.count += 1;
    if (current.count > limit) {
      const retryAfter = Math.ceil((windowMs - (now - current.startedAt)) / 1000);
      res.setHeader("Retry-After", retryAfter);
      return res.status(429).json({
        success: false,
        statusCode: 429,
        correlationId: res.locals.correlationId,
        data: null,
        error: "Rate limit exceeded",
      });
    }

    return next();
  };
}
