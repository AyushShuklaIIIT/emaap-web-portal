import { Request, Response } from "express";
import { AppError } from "../../errors/AppError";
import {
  getAdminDashboardService,
  getAdminAllocationsService,
  exportAdminDashboardService,
} from "../../services/admin/dashboard.service";

export const getAdminDashboard = async (req: Request, res: Response) => {
  try {
    const financialYear =
      typeof req.query.financialYear === "string"
        ? req.query.financialYear
        : undefined;

    const data = await getAdminDashboardService(financialYear);

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    }
    console.error("Get admin dashboard error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch admin dashboard",
    });
  }
};

export const getAdminAllocations = async (_req: Request, res: Response) => {
  try {
    const data = await getAdminAllocationsService();
    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    }
    console.error("Get admin allocations error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch allocations",
    });
  }
};

export const exportAdminDashboard = async (req: Request, res: Response) => {
  try {
    const financialYear =
      typeof req.query.financialYear === "string"
        ? req.query.financialYear
        : undefined;

    const { csv, fileName } = await exportAdminDashboardService(financialYear);

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);

    return res.status(200).send(csv);
  } catch (error) {
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    }
    console.error("Export admin dashboard error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to export admin report",
    });
  }
};
