import { Request, Response } from "express";
import { AppError } from "../errors/AppError";
import {
  getApplicationsDashboardService,
  getBusinessDashboardService,
} from "../services/dashboard.service";

export const getBusinessDashboard = async (req: Request, res: Response) => {
  try {
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
  } catch (err) {
    console.log(err);

    if (err instanceof AppError) {
      return res.status(err.statusCode).json({
        success: false,
        message: err.message,
      });
    }
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

export const getApplicationsDashboard = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    if (!userId || typeof userId !== "string") {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID",
      });
    }

    const applications = await getApplicationsDashboardService(userId);

    res.status(200).json({
      success: true,
      data: applications,
    });
  } catch (err) {
    console.log(err);

    if (err instanceof AppError) {
      return res.status(err.statusCode).json({
        success: false,
        message: err.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
