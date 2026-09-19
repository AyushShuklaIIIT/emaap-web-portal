import express, { type RequestHandler } from "express";
import { z } from "zod";
import { createRateLimiter } from "../middleware/rate-limit";
import { proxyRequest } from "../services/gateway.service";

const gatewayRequestSchema = z.object({
  targetUrl: z.string().url(),
  method: z.string().optional(),
  body: z.unknown().optional(),
  headers: z.record(z.string(), z.string()).optional(),
  timeoutMs: z.number().int().positive().max(120_000).optional(),
  retryCount: z.number().int().min(1).max(3).optional(),
});

export const router = express.Router();

const handleProxy: RequestHandler = async (req, res) => {
  const parsed = gatewayRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      statusCode: 400,
      correlationId: res.locals.correlationId,
      data: null,
      error: "Invalid gateway request",
    });
  }

  const response = await proxyRequest(parsed.data);
  return res.status(response.statusCode).json(response);
};

router.post("/proxy", createRateLimiter(), handleProxy);
