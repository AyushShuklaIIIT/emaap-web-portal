import express from "express";
import { z } from "zod";
import { GstnVerificationError, verifyGstin } from "../services/gstn.service";

const requestSchema = z.object({
  gstin: z.string().min(1),
  userId: z.string().optional(),
});

export const gstnRouter = express.Router();

gstnRouter.post("/verify", async (req, res) => {
  const parsed = requestSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      error: "A GSTIN is required",
      code: "INVALID_GSTIN",
    });
  }

  try {
    const data = await verifyGstin(parsed.data);
    return res.json({ success: true, data });
  } catch (error) {
    if (error instanceof GstnVerificationError) {
      return res.status(error.statusCode).json({
        success: false,
        error: error.message,
        code: error.code,
      });
    }
    console.error("GSTN verification request failed", error);
    return res.status(502).json({
      success: false,
      error: "Unable to verify GSTIN",
      code: "UPSTREAM_ERROR",
    });
  }
});
