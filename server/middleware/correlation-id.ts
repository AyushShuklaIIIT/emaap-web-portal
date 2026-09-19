import { randomUUID } from "node:crypto";
import type { RequestHandler } from "express";

export const correlationIdMiddleware: RequestHandler = (req, res, next) => {
  const correlationId = req.get("x-correlation-id") || randomUUID();
  req.headers["x-correlation-id"] = correlationId;
  res.setHeader("x-correlation-id", correlationId);
  res.locals.correlationId = correlationId;
  next();
};
