import type { RequestHandler } from "express";
import type { Prisma } from "../generated/prisma/client";
import { z } from "zod";
import { sendWelcomeEmail } from "../services/welcome-email.service";
import { randomUUID } from "node:crypto";
import { catchAsync } from "../middleware/catchAsync";
import { AppError } from "../errors/AppError";

const querySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  role: z
    .enum(["STAKEHOLDER", "ADMIN", "LMO", "GATC_PRINCIPAL", "GATC_OFFICER"])
    .optional(),
  state: z.string().trim().min(1).max(100).optional(),
});

const rejectionSchema = z.object({
  rejectionReason: z.string().trim().min(1).max(2000),
});

const approvePayloadSchema = z.object({
  ind_mark_code: z.string().trim().min(1).optional(),
  approval_cert_no: z.string().trim().min(1).optional(),
  centre_code: z.string().trim().min(1).optional(),
  valid_from: z.coerce.date().optional(),
  valid_to: z.coerce.date().optional(),
  approved_categories: z.array(z.string()).default([]),
});

export const listPendingRegistrations: RequestHandler = catchAsync(
  async (req, res) => {
    const parsed = querySchema.safeParse(req.query);
    if (!parsed.success)
      return res
        .status(400)
        .json({ success: false, error: "Invalid pagination or filter" });

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
                select: {
                  id: true,
                  docType: true,
                  fileName: true,
                  fileType: true,
                  fileSize: true,
                  storagePath: true,
                  uploadedAt: true,
                },
              },
            },
          },
        },
      }),
    ]);
    return res.json({
      success: true,
      data: applications,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  },
);

export const approveRegistration: RequestHandler = catchAsync(
  async (req, res) => {
    const applicationId = z.string().uuid().safeParse(req.params.id);
    if (!applicationId.success)
      return res
        .status(400)
        .json({ success: false, error: "Invalid application ID" });

    const parsedBody = approvePayloadSchema.safeParse(req.body || {});
    if (!parsedBody.success) {
      return res
        .status(400)
        .json({ success: false, error: "Invalid payload details" });
    }
    const body = parsedBody.data;

    const { prisma } = await import("../lib/prisma");
    const approved = await prisma.$transaction(async (transaction) => {
      const application = await transaction.registrationApplication.findUnique({
        where: { id: applicationId.data },
        include: { user: true },
      });
      if (!application)
        throw new AppError(404, "Registration application not found");
      if (application.status === "APPROVED")
        throw new AppError(409, "Registration is already approved");
      if (application.status === "REJECTED")
        throw new AppError(409, "Rejected registrations cannot be approved");

      const stateObj = await transaction.state.findFirst({
        where: {
          OR: [
            { state_code: application.user.jurisdiction_state },
            { state_name: application.user.jurisdiction_state },
          ],
        },
      });

      const isGatc =
        application.role === "GATC_PRINCIPAL" ||
        application.role === "GATC_OFFICER" ||
        (application.role as string) === "GATC_PRINCIPAL";

      if (isGatc && !stateObj) {
        throw new AppError(
          400,
          "GATC does not have a valid jurisdiction state",
        );
      }

      if (isGatc) {
        if (
          !body.ind_mark_code ||
          !body.approval_cert_no ||
          !body.centre_code ||
          !body.valid_from ||
          !body.valid_to
        ) {
          throw new AppError(
            400,
            "GATC attributes and validity dates are required for approval",
          );
        }
        await transaction.gatcCentre.create({
          data: {
            centre_code: body.centre_code,
            approval_cert_no: body.approval_cert_no,
            ind_mark_code: body.ind_mark_code,
            valid_from: body.valid_from,
            valid_to: body.valid_to,
            status: "ACTIVE",
            lat: application.lat ?? 0,
            long: application.long ?? 0,
            principal_officer_id: application.userId,
            approved_categories: body.approved_categories ?? [],
          },
        });
      }

      if (application.role === "STAKEHOLDER") {
        const stateObj = await transaction.state.findFirst({
          where: {
            OR: [
              { state_code: application.user.jurisdiction_state },
              { state_name: application.user.jurisdiction_state },
            ],
          },
        });

        if (!stateObj) {
          throw new AppError(
            400,
            "Stakeholder does not have a valid jurisdiction state",
          );
        }
        if (!application.user.jurisdiction_district_id) {
          throw new AppError(
            400,
            "Stakeholder does not have a valid district assigned",
          );
        }

        let entityType: any = "USER";
        if (application.user.category === "MANUFACTURER")
          entityType = "MANUFACTURER";
        else if (application.user.category === "DEALER") entityType = "DEALER";

        await transaction.businessProfile.create({
          data: {
            registration_number:
              application.user.tradeLicenseNo || `REG-${Date.now()}`,
            trade_name:
              application.user.businessName ||
              application.user.fullName ||
              "Default Business",
            entity_type: entityType,
            geo_address: application.user.address || "Registered Address",
            state_id: stateObj.state_id,
            district_id: application.user.jurisdiction_district_id,
            user_id: application.user.user_id,
          },
        });
      }

      if (application.role === "LMO") {
        const stateObj = await transaction.state.findFirst({
          where: {
            OR: [
              { state_code: application.user.jurisdiction_state },
              { state_name: application.user.jurisdiction_state },
            ],
          },
        });

        if (!stateObj) {
          throw new AppError(
            400,
            "LMO does not have a valid jurisdiction state",
          );
        }
        if (!application.user.employeeId) {
          throw new AppError(400, "LMO does not have an employee ID");
        }

        await transaction.lmoOfficer.create({
          data: {
            employee_id: application.user.employeeId,
            user_id: application.user.user_id,
            state_id: stateObj.state_id,
          },
        });
      }

      const user = await transaction.user.update({
        where: { user_id: application.userId },
        data: {
          isActive: true,
          ...(stateObj ? { jurisdiction_state: stateObj.state_code } : {}),
        },
        select: {
          user_id: true,
          email: true,
          fullName: true,
          name: true,
          registrationRole: true,
        },
      });
      const updatedApplication =
        await transaction.registrationApplication.update({
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
      welcomeEmailError =
        error instanceof Error ? error.message : "Welcome email failed";
      console.error("Registration approved but welcome email failed", error);
    }
    return res.json({
      success: true,
      ...approved,
      welcomeEmailSent,
      ...(welcomeEmailError ? { welcomeEmailError } : {}),
    });
  },
);

export const rejectRegistration: RequestHandler = catchAsync(
  async (req, res) => {
    const applicationId = z.string().uuid().safeParse(req.params.id);
    const reason = rejectionSchema.safeParse(req.body);
    if (!applicationId.success || !reason.success) {
      return res
        .status(400)
        .json({ success: false, error: "A rejection reason is required" });
    }

    const { prisma } = await import("../lib/prisma");
    const result = await prisma.$transaction(async (transaction) => {
      const application = await transaction.registrationApplication.findUnique({
        where: { id: applicationId.data },
      });
      if (!application)
        throw new AppError(404, "Registration application not found");
      if (application.status === "APPROVED")
        throw new AppError(409, "Approved registrations cannot be rejected");
      return transaction.registrationApplication.update({
        where: { id: application.id },
        data: {
          status: "REJECTED",
          rejectionReason: reason.data.rejectionReason,
          reviewedBy: res.locals.adminUserId,
          reviewedAt: new Date(),
        },
        select: {
          id: true,
          status: true,
          rejectionReason: true,
          reviewedAt: true,
        },
      });
    });
    return res.json({ success: true, application: result });
  },
);
