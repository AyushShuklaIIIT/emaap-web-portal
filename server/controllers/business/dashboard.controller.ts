import type { Request, Response } from "express";
import { AppError } from "../../errors/AppError";
import {
  getApplicationsDashboardService,
  getBusinessDashboardService,
} from "../../services/business/dashboard.service";
import { catchAsync } from "../../middleware/catchAsync";

export const getBusinessDashboard = catchAsync(
  async (req: Request, res: Response) => {
    const { userId } = req.params;

    if (!userId || typeof userId !== "string") {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID",
      });
    }

    const details = await getBusinessDashboardService(userId);

    return res.status(200).json({
      success: true,
      data: details,
    });
  },
);

export const getApplicationsDashboard = catchAsync(
  async (req: Request, res: Response) => {
    const { userId } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 5;

    if (!userId || typeof userId !== "string") {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID",
      });
    }

    const result = await getApplicationsDashboardService(userId, page, limit);

    return res.status(200).json({
      success: true,
      data: result.applications,
      pagination: result.pagination,
    });
  },
);
