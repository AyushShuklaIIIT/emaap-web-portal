import express, { type RequestHandler } from "express";
import { scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { z } from "zod";
import jwt from "jsonwebtoken";
import {
  dispatchOtp,
  OtpServiceError,
  resendOtp,
  verifyOtp,
} from "../services/otpService";

const dispatchSchema = z.object({
  userId: z.string().min(1),
  mobileNumber: z.string().min(8),
  emailAddress: z.string().email(),
});

const verifySchema = z.object({
  sessionId: z.string().uuid(),
  mobileOtp: z.string().regex(/^\d{6}$/).optional(),
  emailOtp: z.string().regex(/^[A-Za-z0-9]{6,8}$/).optional(),
}).refine((value) => Boolean(value.mobileOtp || value.emailOtp), {
  message: "At least one OTP is required",
});

function sendError(res: Parameters<RequestHandler>[1], error: unknown) {
  if (error instanceof OtpServiceError) {
    return res.status(error.statusCode).json({ error: error.message });
  }
  console.error("OTP service request failed", error);
  return res.status(502).json({ error: "Unable to process OTP request" });
}

export const authRouter = express.Router();
const scrypt = promisify(scryptCallback);

const loginSchema = z.object({
  mobile: z.string().regex(/^[6-9]\d{9}$/),
  password: z.string().min(1),
  role: z.enum(["business", "admin", "gatc"]),
});

const roleMap = {
  business: "BUSINESS",
  admin: "ADMIN",
  gatc: "GATC_PRINCIPAL",
} as const;

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) throw new Error("JWT_SECRET must be configured");
  return secret;
}

authRouter.post("/login", async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ success: false, error: "Enter a valid mobile number and password" });
  }

  try {
    const { prisma } = await import("../lib/prisma");
    const user = await prisma.user.findFirst({
      where: { mobile: parsed.data.mobile, role: roleMap[parsed.data.role] },
      select: {
        user_id: true,
        passwordHash: true,
        isActive: true,
        email: true,
        fullName: true,
        name: true,
        mobile: true,
        businessName: true,
        jurisdiction_state: true,
        jurisdiction_district: true,
      },
    });
    if (!user?.passwordHash) {
      return res.status(401).json({ success: false, error: "Invalid mobile number or password" });
    }
    if (!user.isActive) {
      return res.status(403).json({ success: false, error: "Your account is awaiting administrator approval" });
    }

    const [salt, expectedHex] = user.passwordHash.split(":");
    if (!salt || !expectedHex) {
      return res.status(401).json({ success: false, error: "Invalid mobile number or password" });
    }
    const derived = await scrypt(parsed.data.password, salt, 64) as Buffer;
    const valid = timingSafeEqual(Buffer.from(derived), Buffer.from(expectedHex, "hex"));
    if (!valid) {
      return res.status(401).json({ success: false, error: "Invalid mobile number or password" });
    }

    return res.json({
      success: true,
      data: {
        token: jwt.sign(
          { sub: user.user_id, role: roleMap[parsed.data.role] },
          getJwtSecret(),
          { expiresIn: "8h" },
        ),
        userId: user.user_id,
        email: user.email,
        fullName: user.fullName ?? user.name,
        mobile: user.mobile,
        businessName: user.businessName,
        jurisdictionState: user.jurisdiction_state,
        jurisdictionDistrict: user.jurisdiction_district,
        role: parsed.data.role,
      },
    });
  } catch (error) {
    console.error("Login request failed", error);
    return res.status(502).json({ success: false, error: "Unable to complete login" });
  }
});

authRouter.post("/send-otp", async (req, res) => {
  const parsed = dispatchSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid OTP dispatch request" });
  try {
    return res.status(201).json(await dispatchOtp(parsed.data));
  } catch (error) {
    return sendError(res, error);
  }
});

authRouter.post("/resend-otp", async (req, res) => {
  const parsed = dispatchSchema.extend({ sessionId: z.string().uuid() }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid OTP resend request" });
  try {
    const { sessionId, ...input } = parsed.data;
    return res.status(200).json(await resendOtp(sessionId, input));
  } catch (error) {
    return sendError(res, error);
  }
});

authRouter.post("/verify-otp", async (req, res) => {
  const parsed = verifySchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid OTP verification request" });
  try {
    return res.status(200).json(await verifyOtp(parsed.data));
  } catch (error) {
    return sendError(res, error);
  }
});
