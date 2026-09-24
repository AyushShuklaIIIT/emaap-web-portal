import { Request, Response } from "express";

import { AppError } from "../../../errors/AppError";
import {
  AppType,
  PaymentStatus,
  WorkflowStatus,
} from "../../../generated/prisma/enums";
import { generateFinancialCsv } from "../../../services/admin/financial.service";
import {
  getStateFinancialReport,
  getStateFinancialTransactionsForExport,
} from "../../../services/admin/state/stateFinancial.service";
import { prisma } from "../../../lib/prisma";

const getStateCodeFromAuth = async (req: Request): Promise<string> => {
  const reqUser = (req as any).user;
  if (!reqUser || !reqUser.user_id) {
    throw new AppError(401, "Authentication required");
  }

  const user = await prisma.user.findUnique({
    where: { user_id: reqUser.user_id },
    select: { jurisdiction_state: true },
  });

  if (
    !user ||
    !user.jurisdiction_state ||
    user.jurisdiction_state === "Central"
  ) {
    throw new AppError(
      403,
      "Access denied: User is not mapped to a valid state jurisdiction",
    );
  }
  return user.jurisdiction_state;
};

const getStringQuery = (value: unknown): string | undefined => {
  return typeof value === "string" ? value : undefined;
};

const getNumberQuery = (value: unknown): number | undefined => {
  if (typeof value !== "string") return undefined;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? undefined : parsed;
};

export const getStateFinancialReportController = async (
  req: Request,
  res: Response,
) => {
  try {
    const stateCode = await getStateCodeFromAuth(req);

    const startDate = getStringQuery(req.query.startDate);
    const endDate = getStringQuery(req.query.endDate);
    const search = getStringQuery(req.query.search);
    const district = getStringQuery(req.query.district);
    const gatcId = getStringQuery(req.query.gatcId);
    const applicationType = getStringQuery(req.query.applicationType) as
      AppType | undefined;
    const workflowStatus = getStringQuery(req.query.workflowStatus) as
      WorkflowStatus | undefined;
    const paymentStatus = getStringQuery(req.query.paymentStatus) as
      PaymentStatus | undefined;
    const page = getNumberQuery(req.query.page);
    const limit = getNumberQuery(req.query.limit);

    const result = await getStateFinancialReport(stateCode, {
      startDate,
      endDate,
      search,
      district,
      gatcId,
      applicationType,
      workflowStatus,
      paymentStatus,
      page,
      limit,
    });

    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    console.error("Get state financial report error:", error);
    return res.status(error instanceof AppError ? error.statusCode : 500).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to fetch state financial report",
    });
  }
};

export const exportStateFinancialReportController = async (
  req: Request,
  res: Response,
) => {
  try {
    const stateCode = await getStateCodeFromAuth(req);

    const startDate = getStringQuery(req.query.startDate);
    const endDate = getStringQuery(req.query.endDate);
    const search = getStringQuery(req.query.search);
    const district = getStringQuery(req.query.district);
    const gatcId = getStringQuery(req.query.gatcId);
    const applicationType = getStringQuery(req.query.applicationType) as
      AppType | undefined;
    const workflowStatus = getStringQuery(req.query.workflowStatus) as
      WorkflowStatus | undefined;
    const paymentStatus = getStringQuery(req.query.paymentStatus) as
      PaymentStatus | undefined;

    const transactions = await getStateFinancialTransactionsForExport(
      stateCode,
      {
        startDate,
        endDate,
        search,
        district,
        gatcId,
        applicationType,
        workflowStatus,
        paymentStatus,
      },
    );

    const csv = generateFinancialCsv(transactions);
    const filename = `${stateCode}-financial-report-${startDate ?? "all"}-${endDate ?? "all"}.csv`;

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

    return res.status(200).send(csv);
  } catch (error) {
    console.error("Export state financial report error:", error);
    return res.status(error instanceof AppError ? error.statusCode : 500).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to export state financial report",
    });
  }
};
