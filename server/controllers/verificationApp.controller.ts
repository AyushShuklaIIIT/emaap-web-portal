import { AppError } from "../errors/AppError";
import { Request, Response } from "express";
import {
  getVerificationAppService,
  postVerificationAppService,
} from "../services/verification.service";
import { VerificationForm } from "../types";

export const getVerificationApp = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    if (!userId || typeof userId !== "string") {
      return res.status(400).json({
        success: false,
        message: "Invalid User ID",
      });
    }

    const applications = await getVerificationAppService(userId);

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
      message: "Internal Server Error",
    });
  }
};

export const postVerificationApp = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const data: VerificationForm = req.body;

    if (!userId || typeof userId !== "string") {
      return res.status(400).json({
        success: false,
        message: "Invalid User ID",
      });
    }

    if (!data) {
      return res.status(400).json({
        success: false,
        message: "Invalid Input",
      });
    }

    const application = await postVerificationAppService(userId, data);

    return res.status(201).json({
      success: true,
      data: application,
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
