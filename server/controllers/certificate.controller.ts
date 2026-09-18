import { Request, Response } from "express";

import { AppError } from "../errors/AppError";
import { getCertificatesService } from "../services/certificate.service";

export const getCertificates = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    if (!userId || typeof userId !== "string") {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    const certificates = await getCertificatesService(userId);

    return res.status(200).json({
      success: true,
      data: certificates,
    });
  } catch (error) {
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    }

    console.error("Get certificates error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch certificates",
    });
  }
};
