import express from "express";
import { z } from "zod";
import { PanVerificationError, verifyPan } from "../services/pan.service";

const requestSchema = z.object({
  panNumber: z.string().min(1),
  entityType: z.enum(["INDIVIDUAL", "COMPANY"]),
  userId: z.string().optional(),
});

export const panRouter = express.Router();

panRouter.post("/verify", async (req, res) => {
  const parsed = requestSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      error: "PAN number and entity type are required",
      code: "INVALID_PAN",
    });
  }

  try {
    const data = await verifyPan(parsed.data);
    return res.json({ success: true, data });
  } catch (error) {
    if (error instanceof PanVerificationError) {
      return res.status(error.statusCode).json({
        success: false,
        error: error.message,
        code: error.code,
      });
    }
    console.error("PAN verification request failed", error);
    return res.status(502).json({
      success: false,
      error: "Unable to verify PAN",
      code: "UPSTREAM_ERROR",
    });
  }
});
