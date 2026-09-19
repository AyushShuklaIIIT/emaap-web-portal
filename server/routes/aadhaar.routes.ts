import express, { type RequestHandler } from "express";
import { z } from "zod";
import { createRateLimiter } from "../middleware/rate-limit";
import { generateAadhaarOtp, verifyAadhaarOtp } from "../services/aadhaar.service";

const generateSchema = z.object({
  aadhaarNumber: z.string().optional(),
  virtualId: z.string().optional(),
  userId: z.string().optional(),
}).refine((value) => Boolean(value.aadhaarNumber) !== Boolean(value.virtualId), {
  message: "Provide exactly one of aadhaarNumber or virtualId",
});

const verifySchema = z.object({
  otpCode: z.string(),
  txnId: z.string().min(1),
  userId: z.string().optional(),
});

const handleGenerateOtp: RequestHandler = async (req, res) => {
  const parsed = generateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ status: "FAILED", error: "Invalid Aadhaar OTP request" });
  }
  try {
    return res.status(200).json(await generateAadhaarOtp(parsed.data));
  } catch (error) {
    return res.status(502).json({
      status: "FAILED",
      error: error instanceof Error ? error.message : "Unable to generate OTP",
    });
  }
};

const handleVerifyOtp: RequestHandler = async (req, res) => {
  const parsed = verifySchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ status: "FAILED", error: "Invalid OTP verification request" });
  }
  try {
    const result = await verifyAadhaarOtp(parsed.data);
    return res.status(result.status === "VERIFIED" ? 200 : 401).json(result);
  } catch (error) {
    return res.status(502).json({
      status: "FAILED",
      error: error instanceof Error ? error.message : "Unable to verify OTP",
    });
  }
};

export const aadhaarRouter = express.Router();
aadhaarRouter.post("/generate-otp", createRateLimiter(), handleGenerateOtp);
aadhaarRouter.post("/verify-otp", createRateLimiter(), handleVerifyOtp);
