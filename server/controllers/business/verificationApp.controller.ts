import { Request, Response } from "express";
import { VerificationForm } from "../../types";
import {
  createVerificationApplicationService,
  getVerificationCategoriesService,
  getVerificationDistrictsService,
  getVerificationConditionsService,
  getVerificationAppService,
  getVerificationFeeQuoteService,
  getVerificationMetadataService,
  postVerificationAppService,
} from "../../services/business/verification.service";
import { AppError } from "../../errors/AppError";
import { createPaymentReceiptRepo } from "../../repositories/payment.repository";
import { randomUUID } from "node:crypto";
import { PaymentMethod } from "../../generated/prisma/enums";

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

export const getVerificationCategories = async (
  req: Request,
  res: Response,
) => {
  try {
    const stateCode = String(req.query.stateCode ?? "")
      .trim()
      .toUpperCase();

    if (!stateCode) {
      return res
        .status(400)
        .json({ success: false, message: "stateCode is required" });
    }

    const data = await getVerificationCategoriesService(stateCode);

    return res.status(200).json({ success: true, data });
  } catch (error) {
    const message = getErrorMessage(error);

    return res
      .status(getErrorStatus(message))
      .json({ success: false, message });
  }
};

export const getVerificationDistricts = async (req: Request, res: Response) => {
  try {
    const stateCode = String(req.query.stateCode ?? "")
      .trim()
      .toUpperCase();

    if (!stateCode) {
      return res
        .status(400)
        .json({ success: false, message: "stateCode is required" });
    }

    const data = await getVerificationDistrictsService(stateCode);

    return res.status(200).json({ success: true, data });
  } catch (error) {
    const message = getErrorMessage(error);

    return res
      .status(getErrorStatus(message))
      .json({ success: false, message });
  }
};

export const getVerificationConditions = async (
  req: Request,
  res: Response,
) => {
  try {
    const stateCode = String(req.query.stateCode ?? "")
      .trim()
      .toUpperCase();
    const categoryCode = String(req.query.categoryCode ?? "").trim();

    if (!stateCode || !categoryCode) {
      return res.status(400).json({
        success: false,
        message: "stateCode and categoryCode are required",
      });
    }

    const data = await getVerificationConditionsService(
      stateCode,
      categoryCode,
    );

    return res.status(200).json({ success: true, data });
  } catch (error) {
    const message = getErrorMessage(error);

    return res
      .status(getErrorStatus(message))
      .json({ success: false, message });
  }
};

export const getVerificationFeeQuote = async (req: Request, res: Response) => {
  try {
    const {
      userId,
      categoryCode,
      stateCode,
      metric,
      error,
      selectedCondition,
    } = req.body;

    const data = await getVerificationFeeQuoteService({
      user_id: userId,
      category_code: categoryCode,
      state_code: stateCode,
      metric,
      error: error === undefined || error === "" ? undefined : Number(error),
      selected_condition: selectedCondition,
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
      error,
      address,
      pincode,
      stateCode,
      lat,
      long,
      paymentMethod,
      district,
      selectedCondition,
      manufacturerFileUrl,
      prevCertificateFileUrl,
    } = req.body;

    const data = await createVerificationApplicationService({
      user_id: userId,
      app_type: appType,
      category_code: categoryCode,
      model_no: modelNo,
      manufacturer_name: manufacturerName,
      instrument_serial_number: instrumentSerialNumber,
      metric,
      error: error === undefined || error === "" ? undefined : Number(error),
      address,
      pincode: Number(pincode),
      state_code: stateCode,
      lat: Number(lat),
      long: Number(long),
      payment_method: paymentMethod,
      district,
      manufacturer_file_url: manufacturerFileUrl,
      previous_certificate_file_url: prevCertificateFileUrl,
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

export const generatePaymentReceiptEndpoint = async (
  req: Request,
  res: Response,
) => {
  try {
    const { appId, paymentMethod, statutoryFee, totalAmount } = req.body;

    if (!appId) {
      return res.status(400).json({ success: false, message: "Missing appId" });
    }

    const receipt = await createPaymentReceiptRepo({
      receipt_id: randomUUID(),
      receipt_no: `RCPT-${Date.now()}`,
      transaction_id: `TXN-${randomUUID().slice(0, 12)}`,
      payment_method: (paymentMethod as PaymentMethod) || "UPI",
      statutory_fee: statutoryFee || 0,
      total_amount: totalAmount || 0,
      app_id: appId,
    });

    return res.status(201).json({ success: true, data: receipt });
  } catch (error) {
    console.error("Error generating receipt:", error);
    return res
      .status(500)
      .json({ success: false, message: "Server error generating receipt" });
  }
};
