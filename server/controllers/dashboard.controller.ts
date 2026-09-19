import type { Request, Response } from "express";
import { AppError } from "../errors/AppError";
import {
  getApplicationsDashboardService,
  getBusinessDashboardService,
} from "../services/dashboard.service";
import { catchAsync } from "../middleware/catchAsync";

export const getBusinessDashboard = catchAsync(async (req: Request, res: Response) => {
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
});

export const getApplicationsDashboard = catchAsync(async (req: Request, res: Response) => {
  const { userId } = req.params;

  if (!userId || typeof userId !== "string") {
    return res.status(400).json({
      success: false,
      message: "Invalid user ID",
    });
  }

  const applications = await getApplicationsDashboardService(userId);

  return res.status(200).json({
    success: true,
    data: applications,
  });
});
