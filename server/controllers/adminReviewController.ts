import type { RequestHandler } from "express";
import type { Prisma } from "../generated/prisma/client";
import { z } from "zod";
import { sendWelcomeEmail } from "../services/welcome-email.service";
import path from "node:path";
import { stat } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { catchAsync } from "../middleware/catchAsync";
import { AppError } from "../errors/AppError";

const querySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  role: z.enum(["STAKEHOLDER", "ADMIN", "GATC_OPERATOR"]).optional(),
  state: z.string().trim().min(1).max(100).optional(),
});

const rejectionSchema = z.object({
  rejectionReason: z.string().trim().min(1).max(2000),
});

export const listPendingRegistrations: RequestHandler = catchAsync(async (req, res) => {
  const parsed = querySchema.safeParse(req.query);
  if (!parsed.success) return res.status(400).json({ success: false, error: "Invalid pagination or filter" });

  const { page, pageSize, role, state } = parsed.data;
  const where: Prisma.RegistrationApplicationWhereInput = {
    status: { in: ["OTP_PENDING", "SUBMITTED", "UNDER_REVIEW"] },
    ...(role ? { role } : {}),
    ...(state ? { user: { jurisdiction_state: state } } : {}),
  };

  const { prisma } = await import("../lib/prisma");
  const [total, applications] = await prisma.$transaction([
    prisma.registrationApplication.count({ where }),
    prisma.registrationApplication.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { submittedAt: "asc" },
      select: {
        id: true,
        role: true,
        status: true,
        submittedAt: true,
        rejectionReason: true,
        user: {
          select: {
            user_id: true,
            fullName: true,
            email: true,
            mobile: true,
            businessName: true,
            jurisdiction_state: true,
            uploadedDocs: {
              select: { id: true, docType: true, fileName: true, fileType: true, fileSize: true, storagePath: true, uploadedAt: true },
            },
          },
        },
      },
    }),
  ]);
  return res.json({
    success: true,
    data: applications,
    pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
  });
});

export const approveRegistration: RequestHandler = catchAsync(async (req, res) => {
  const applicationId = z.string().uuid().safeParse(req.params.id);
  if (!applicationId.success) return res.status(400).json({ success: false, error: "Invalid application ID" });

  const { prisma } = await import("../lib/prisma");
  const approved = await prisma.$transaction(async (transaction) => {
    const application = await transaction.registrationApplication.findUnique({
      where: { id: applicationId.data },
      include: { user: true },
    });
    if (!application) throw new AppError(404, "Registration application not found");
    if (application.status === "APPROVED") throw new AppError(409, "Registration is already approved");
    if (application.status === "REJECTED") throw new AppError(409, "Rejected registrations cannot be approved");

    const user = await transaction.user.update({
      where: { user_id: application.userId },
      data: { isActive: true },
      select: { user_id: true, email: true, fullName: true, name: true, registrationRole: true },
    });
    const updatedApplication = await transaction.registrationApplication.update({
      where: { id: application.id },
      data: {
        status: "APPROVED",
        reviewedBy: res.locals.adminUserId,
        reviewedAt: new Date(),
      },
      select: { id: true, status: true },
    });
    return { user, application: updatedApplication };
  });

  let welcomeEmailSent = false;
  let welcomeEmailError: string | undefined;
  try {
    welcomeEmailSent = await sendWelcomeEmail({
      email: approved.user.email,
      fullName: approved.user.fullName ?? approved.user.name,
      role: approved.user.registrationRole ?? "USER",
    });
  } catch (error) {
    welcomeEmailError = error instanceof Error ? error.message : "Welcome email failed";
    console.error("Registration approved but welcome email failed", error);
  }
  return res.json({ success: true, ...approved, welcomeEmailSent, ...(welcomeEmailError ? { welcomeEmailError } : {}) });
});

export const rejectRegistration: RequestHandler = catchAsync(async (req, res) => {
  const applicationId = z.string().uuid().safeParse(req.params.id);
  const reason = rejectionSchema.safeParse(req.body);
  if (!applicationId.success || !reason.success) {
    return res.status(400).json({ success: false, error: "A rejection reason is required" });
  }

  const { prisma } = await import("../lib/prisma");
  const result = await prisma.$transaction(async (transaction) => {
    const application = await transaction.registrationApplication.findUnique({ where: { id: applicationId.data } });
    if (!application) throw new AppError(404, "Registration application not found");
    if (application.status === "APPROVED") throw new AppError(409, "Approved registrations cannot be rejected");
    return transaction.registrationApplication.update({
      where: { id: application.id },
      data: {
        status: "REJECTED",
        rejectionReason: reason.data.rejectionReason,
        reviewedBy: res.locals.adminUserId,
        reviewedAt: new Date(),
      },
      select: { id: true, status: true, rejectionReason: true, reviewedAt: true },
    });
  });
  return res.json({ success: true, application: result });
});

export const downloadRegistrationDocument: RequestHandler = catchAsync(async (req, res) => {
  const documentId = z.string().uuid().safeParse(req.params.id);
  if (!documentId.success) return res.status(400).json({ success: false, error: "Invalid document ID" });
  const { prisma } = await import("../lib/prisma");
  const document = await prisma.userDocument.findUnique({ where: { id: documentId.data } });
  if (!document) throw new AppError(404, "Document not found");
  const filename = path.basename(document.storagePath);
  const filePath = path.join(process.cwd(), "uploads", "registrations", filename);
  await stat(filePath);
  res.setHeader("x-correlation-id", res.locals.correlationId ?? randomUUID());
  return res.sendFile(filePath);
});
