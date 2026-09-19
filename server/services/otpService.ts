import { createHash, randomBytes, randomInt } from "node:crypto";
import { logExternalApiCall } from "./external-api-audit.service";

export interface OtpDispatchInput {
  userId: string;
  mobileNumber: string;
  emailAddress: string;
}

export interface OtpDispatchResult {
  sessionId: string;
  expiresAt: Date;
  mobileSent: boolean;
  emailSent: boolean;
}

export interface OtpVerificationInput {
  sessionId: string;
  mobileOtp?: string;
  emailOtp?: string;
}

export interface OtpVerificationResult {
  mobileVerified: boolean;
  emailVerified: boolean;
  verified: boolean;
  expiresAt: Date;
}

export class OtpServiceError extends Error {
  constructor(
    message: string,
    readonly statusCode: number,
  ) {
    super(message);
    this.name = "OtpServiceError";
  }
}

const OTP_TTL_MS = 5 * 60 * 1000;
const RESEND_COOLDOWN_MS = 60 * 1000;
const MAX_RESENDS = 3;

function mockMode(): boolean {
  return process.env.MOCK_MODE?.toLowerCase() === "true";
}

function hashOtp(otp: string, salt: string): string {
  return createHash("sha256").update(`${salt}:${otp}`).digest("hex");
}

function generateMobileOtp(): string {
  if (mockMode()) return "123456";
  return randomInt(0, 1_000_000).toString().padStart(6, "0");
}

function generateEmailOtp(): string {
  if (mockMode()) return "TEST2026";
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 8 }, () => alphabet[randomInt(0, alphabet.length)]).join("");
}

function getPrisma() {
  return import("../lib/prisma").then(({ prisma }) => prisma);
}

async function sendSms(
  mobileNumber: string,
  otp: string,
): Promise<boolean> {
  if (mockMode()) return true;
  const endpoint = process.env.NIC_SMS_API_URL;
  if (!endpoint) throw new OtpServiceError("NIC_SMS_API_URL is not configured", 503);

  const startedAt = Date.now();
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ mobileNumber, otp }),
  });
  const data = await response.json().catch(() => null);
  void logExternalApiCall({
    providerName: "NIC_SMS",
    endpoint,
    requestPayload: { mobileNumber: "[REDACTED]", otpProvided: true },
    responsePayload: data,
    statusCode: response.status,
    latencyMs: Date.now() - startedAt,
  });
  return response.ok;
}

async function sendEmail(
  emailAddress: string,
  otp: string,
): Promise<boolean> {
  if (mockMode()) return true;
  const endpoint = process.env.EMAIL_OTP_API_URL;
  if (!endpoint) throw new OtpServiceError("EMAIL_OTP_API_URL is not configured", 503);

  const startedAt = Date.now();
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ emailAddress, otp }),
  });
  const data = await response.json().catch(() => null);
  void logExternalApiCall({
    providerName: "EMAIL_OTP",
    endpoint,
    requestPayload: { emailAddress: "[REDACTED]", otpProvided: true },
    responsePayload: data,
    statusCode: response.status,
    latencyMs: Date.now() - startedAt,
  });
  return response.ok;
}

export async function dispatchOtp(
  input: OtpDispatchInput,
): Promise<OtpDispatchResult> {
  if (!/^\+?[1-9]\d{7,14}$/.test(input.mobileNumber)) {
    throw new OtpServiceError("Invalid mobile number", 400);
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.emailAddress)) {
    throw new OtpServiceError("Invalid email address", 400);
  }

  const prisma = await getPrisma();
  const user = await prisma.user.findUnique({ where: { user_id: input.userId } });
  if (!user) throw new OtpServiceError("User not found", 404);

  return persistOtp(prisma, input);
}

async function persistOtp(
  prisma: Awaited<ReturnType<typeof getPrisma>>,
  input: OtpDispatchInput,
  sessionId?: string,
  resendCount = 0,
): Promise<OtpDispatchResult> {
  const mobileOtp = generateMobileOtp();
  const emailOtp = generateEmailOtp();
  const mobileOtpSalt = randomBytes(16).toString("hex");
  const emailOtpSalt = randomBytes(16).toString("hex");
  const now = new Date();
  const expiresAt = new Date(now.getTime() + OTP_TTL_MS);
  const [mobileSent, emailSent] = await Promise.all([
    sendSms(input.mobileNumber, mobileOtp),
    sendEmail(input.emailAddress, emailOtp),
  ]);

  const data = {
      userId: input.userId,
      mobileOtp: mobileSent ? hashOtp(mobileOtp, mobileOtpSalt) : null,
      emailOtp: emailSent ? hashOtp(emailOtp, emailOtpSalt) : null,
      mobileOtpSalt: mobileSent ? mobileOtpSalt : null,
      emailOtpSalt: emailSent ? emailOtpSalt : null,
      expiresAt,
      lastSentAt: now,
      resendCount,
    };
  const session = sessionId
    ? await prisma.otpVerificationSession.update({
        where: { id: sessionId },
        data,
        select: { id: true, expiresAt: true },
      })
    : await prisma.otpVerificationSession.create({
        data,
        select: { id: true, expiresAt: true },
      });

  return {
    sessionId: session.id,
    expiresAt: session.expiresAt,
    mobileSent,
    emailSent,
  };
}

export async function resendOtp(
  sessionId: string,
  input: OtpDispatchInput,
): Promise<OtpDispatchResult> {
  const prisma = await getPrisma();
  const session = await prisma.otpVerificationSession.findUnique({
    where: { id: sessionId },
  });
  if (!session) throw new OtpServiceError("OTP session not found", 404);
  if (session.resendCount >= MAX_RESENDS) {
    throw new OtpServiceError("Maximum OTP resend attempts exceeded", 429);
  }
  if (Date.now() - session.lastSentAt.getTime() < RESEND_COOLDOWN_MS) {
    throw new OtpServiceError("Please wait before requesting another OTP", 429);
  }

  return persistOtp(prisma, input, sessionId, session.resendCount + 1);
}

export async function verifyOtp(
  input: OtpVerificationInput,
): Promise<OtpVerificationResult> {
  const prisma = await getPrisma();
  const session = await prisma.otpVerificationSession.findUnique({
    where: { id: input.sessionId },
  });
  if (!session) throw new OtpServiceError("OTP session not found", 404);
  if (session.expiresAt.getTime() <= Date.now()) {
    throw new OtpServiceError("OTP session has expired", 410);
  }

  const mobileVerified =
    session.mobileVerified ||
    Boolean(
      input.mobileOtp &&
        session.mobileOtp &&
        session.mobileOtpSalt &&
        hashOtp(input.mobileOtp, session.mobileOtpSalt) === session.mobileOtp,
    );
  const emailVerified =
    session.emailVerified ||
    Boolean(
      input.emailOtp &&
        session.emailOtp &&
        session.emailOtpSalt &&
        hashOtp(input.emailOtp, session.emailOtpSalt) === session.emailOtp,
    );

  if (!mobileVerified && input.mobileOtp) {
    throw new OtpServiceError("Invalid mobile OTP", 401);
  }
  if (!emailVerified && input.emailOtp) {
    throw new OtpServiceError("Invalid email OTP", 401);
  }

  await prisma.otpVerificationSession.update({
    where: { id: input.sessionId },
    data: { mobileVerified, emailVerified },
  });
  if (mobileVerified && emailVerified) {
    await prisma.user.update({
      where: { user_id: session.userId },
      data: { mobileVerified: true, emailVerified: true },
    });
    await prisma.registrationApplication.updateMany({
      where: { userId: session.userId, status: "OTP_PENDING" },
      data: { status: "SUBMITTED" },
    });
  }
  return {
    mobileVerified,
    emailVerified,
    verified: mobileVerified && emailVerified,
    expiresAt: session.expiresAt,
  };
}

export const otpPolicy = {
  expiresInMs: OTP_TTL_MS,
  resendCooldownMs: RESEND_COOLDOWN_MS,
  maxResends: MAX_RESENDS,
};
