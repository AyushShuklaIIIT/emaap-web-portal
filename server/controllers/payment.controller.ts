import { Request, Response } from "express";
import { AppError } from "../errors/AppError";
import {
  getPaymentDashboardService,
  getPaymentReceiptService,
} from "../services/payment.service";

export const getPaymentDashboard = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    if (!userId || typeof userId !== "string") {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    const data = await getPaymentDashboardService(userId);

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

    console.error("Get payment dashboard error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch payment details",
    });
  }
};

export const getPaymentReceipt = async (req: Request, res: Response) => {
  try {
    const { userId, receiptId } = req.params;

    if (!userId || typeof userId !== "string") {
      return res.status(400).json({
        success: false,
        message: "User ID Invalid",
      });
    }

    if (!receiptId || typeof receiptId !== "string") {
      return res.status(400).json({
        success: false,
        message: "Receipt ID Invalid",
      });
    }

    const receipt = await getPaymentReceiptService(userId, receiptId);

    return res.status(200).json({
      success: true,
      data: receipt,
    });
  } catch (error) {
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    }

    console.error("Get payment receipt error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch payment receipt",
    });
  }
};
