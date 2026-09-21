import { Request, Response } from "express";

import {
  getFinancialReport,
  getFinancialTransactionsForExport,
  generateFinancialCsv,
} from "../../services/admin/financial.service";
import {
  AppType,
  PaymentStatus,
  WorkflowStatus,
} from "../../generated/prisma/enums";

const getStringQuery = (value: unknown): string | undefined => {
  return typeof value === "string" ? value : undefined;
};

const getNumberQuery = (value: unknown): number | undefined => {
  if (typeof value !== "string") {
    return undefined;
  }

  const parsed = Number(value);

  return Number.isNaN(parsed) ? undefined : parsed;
};

export const getFinancialReportController = async (
  req: Request,
  res: Response,
) => {
  try {
    const startDate = getStringQuery(req.query.startDate);
    const endDate = getStringQuery(req.query.endDate);
    const search = getStringQuery(req.query.search);

    const applicationType = getStringQuery(req.query.applicationType) as
      AppType | undefined;

    const workflowStatus = getStringQuery(req.query.workflowStatus) as
      WorkflowStatus | undefined;
    const paymentStatus = getStringQuery(req.query.paymentStatus) as
      PaymentStatus | undefined;

    const page = getNumberQuery(req.query.page);
    const limit = getNumberQuery(req.query.limit);
    const result = await getFinancialReport({
      startDate,
      endDate,
      search,
      applicationType,
      workflowStatus,
      paymentStatus,
      page,
      limit,
    });

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Get financial report error:", error);

    return res.status(500).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to fetch financial report",
    });
  }
};

export const exportFinancialReportController = async (
  req: Request,
  res: Response,
) => {
  try {
    const startDate = getStringQuery(req.query.startDate);
    const endDate = getStringQuery(req.query.endDate);

    const search = getStringQuery(req.query.search);

    const applicationType = getStringQuery(req.query.applicationType) as
      AppType | undefined;

    const workflowStatus = getStringQuery(req.query.workflowStatus) as
      WorkflowStatus | undefined;
    const paymentStatus = getStringQuery(req.query.paymentStatus) as
      PaymentStatus | undefined;

    const transactions = await getFinancialTransactionsForExport({
      startDate,
      endDate,
      search,
      applicationType,
      workflowStatus,
      paymentStatus,
    });

    const csv = generateFinancialCsv(transactions);

    const filename = `financial-report-${startDate ?? "all"}-${
      endDate ?? "all"
    }.csv`;

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

    return res.status(200).send(csv);
  } catch (error) {
    console.error("Export financial report error:", error);

    return res.status(500).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to export financial report",
    });
  }
};
