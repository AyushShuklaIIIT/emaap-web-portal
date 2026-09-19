import { afterEach, describe, expect, it, vi } from "vitest";
import { createHash } from "node:crypto";

const fakePrisma = {
  user: {
    findUnique: vi.fn().mockResolvedValue({ user_id: "user-1" }),
    update: vi.fn(),
  },
  otpVerificationSession: {
    create: vi.fn(),
    findUnique: vi.fn(),
    update: vi.fn(),
  },
  registrationApplication: {
    updateMany: vi.fn(),
  },
};

vi.mock("../lib/prisma", () => ({ prisma: fakePrisma }));

import {
  dispatchOtp,
  otpPolicy,
  verifyOtp,
} from "./otpService";

describe("OTP service", () => {
  afterEach(() => {
    vi.clearAllMocks();
    delete process.env.MOCK_MODE;
  });

  it("stores salted hashes and dispatches both channels in mock mode", async () => {
    process.env.MOCK_MODE = "true";
    fakePrisma.otpVerificationSession.create.mockImplementation(
      async ({ data }: { data: Record<string, unknown> }) => ({
        id: "session-1",
        expiresAt: data.expiresAt,
      }),
    );

    const result = await dispatchOtp({
      userId: "user-1",
      mobileNumber: "+919876543210",
      emailAddress: "person@example.com",
    });

    const data = fakePrisma.otpVerificationSession.create.mock.calls[0][0].data;
    expect(result).toMatchObject({
      sessionId: "session-1",
      mobileSent: true,
      emailSent: true,
    });
    expect(data.mobileOtp).toMatch(/^[a-f0-9]{64}$/);
    expect(data.emailOtp).toMatch(/^[a-f0-9]{64}$/);
    expect(data.mobileOtpSalt).toMatch(/^[a-f0-9]{32}$/);
    expect(data.emailOtpSalt).toMatch(/^[a-f0-9]{32}$/);
    expect(data.expiresAt.getTime() - Date.now()).toBeGreaterThan(otpPolicy.expiresInMs - 2000);

    fakePrisma.otpVerificationSession.findUnique.mockResolvedValue({
      id: "session-1",
      mobileOtp: data.mobileOtp,
      emailOtp: data.emailOtp,
      mobileOtpSalt: data.mobileOtpSalt,
      emailOtpSalt: data.emailOtpSalt,
      mobileVerified: false,
      emailVerified: false,
      expiresAt: data.expiresAt,
    });
    fakePrisma.otpVerificationSession.update.mockResolvedValue({});
    await expect(
      verifyOtp({
        sessionId: "session-1",
        mobileOtp: "123456",
        emailOtp: "TEST2026",
      }),
    ).resolves.toMatchObject({ verified: true });
  });

  it("verifies each channel against its salted hash", async () => {
    const mobileSalt = "a".repeat(32);
    const emailSalt = "b".repeat(32);
    const hash = (salt: string, otp: string) =>
      createHash("sha256").update(`${salt}:${otp}`).digest("hex");
    fakePrisma.otpVerificationSession.findUnique.mockResolvedValue({
      id: "session-1",
      mobileOtp: hash(mobileSalt, "123456"),
      emailOtp: hash(emailSalt, "AB12CD34"),
      mobileOtpSalt: mobileSalt,
      emailOtpSalt: emailSalt,
      mobileVerified: false,
      emailVerified: false,
      expiresAt: new Date(Date.now() + 60_000),
    });
    fakePrisma.otpVerificationSession.update.mockResolvedValue({});

    const result = await verifyOtp({
      sessionId: "session-1",
      mobileOtp: "123456",
      emailOtp: "AB12CD34",
    });

    expect(result).toMatchObject({
      mobileVerified: true,
      emailVerified: true,
      verified: true,
    });
  });
});
