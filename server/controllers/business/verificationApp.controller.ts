import { Request, Response } from "express";
import { VerificationForm } from "../../types";
import {
  createVerificationApplicationService,
  getVerificationAppService,
  getVerificationFeeQuoteService,
  getVerificationMetadataService,
  postVerificationAppService,
} from "../../services/business/verification.service";
import { AppError } from "../../errors/AppError";

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

const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }

  return "Something went wrong";
};

const getErrorStatus = (message: string): number => {
  if (message.includes("not found") || message.includes("does not exist")) {
    return 404;
  }

  if (message.includes("already")) {
    return 409;
  }

  return 400;
};

export const getVerificationMetadata = async (_req: Request, res: Response) => {
  try {
    const data = await getVerificationMetadataService();

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("Get verification metadata error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to load verification metadata",
    });
  }
};

export const getVerificationFeeQuote = async (req: Request, res: Response) => {
  try {
    const { userId, categoryCode, stateCode, metric } = req.body;

    const data = await getVerificationFeeQuoteService({
      user_id: userId,
      category_code: categoryCode,
      state_code: stateCode,
      metric,
    });

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("Get verification fee quote error:", error);

    const message = getErrorMessage(error);

    return res.status(getErrorStatus(message)).json({
      success: false,
      message,
    });
  }
};

export const createVerificationApplication = async (
  req: Request,
  res: Response,
) => {
  try {
    const {
      userId,
      appType,
      categoryCode,
      modelNo,
      manufacturerName,
      instrumentSerialNumber,
      metric,
      address,
      pincode,
      stateCode,
      lat,
      long,
      paymentMethod,
    } = req.body;

    const data = await createVerificationApplicationService({
      user_id: userId,
      app_type: appType,
      category_code: categoryCode,
      model_no: modelNo,
      manufacturer_name: manufacturerName,
      instrument_serial_number: instrumentSerialNumber,
      metric,
      address,
      pincode: Number(pincode),
      state_code: stateCode,
      lat: Number(lat),
      long: Number(long),
      payment_method: paymentMethod,
    });

    return res.status(201).json({
      success: true,
      message: "Verification application created successfully",
      data,
    });
  } catch (error) {
    console.error("Create verification application error:", error);

    const message = getErrorMessage(error);

    return res.status(getErrorStatus(message)).json({
      success: false,
      message,
    });
  }
};
