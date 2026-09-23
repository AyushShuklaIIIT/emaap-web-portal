import type { Request, Response } from "express";

import {
  GatcServiceError,
  getGatcDashboardService,
  getGatcSettingsService,
  registerGatcOfficerService,
} from "../../services/gatc/gatc.service.js";

type AuthenticatedRequest = Request & {
  user?: {
    user_id?: string;
    userId?: string;
    id?: string;
  };
};

const getUserId = (req: AuthenticatedRequest) => {
  const userId = req.user?.user_id ?? req.user?.userId ?? req.user?.id;

  if (!userId) {
    throw new GatcServiceError("Authentication required", 401);
  }

  return userId;
};

const getErrorResponse = (error: unknown) => {
  if (error instanceof GatcServiceError) {
    return {
      status: error.statusCode,
      message: error.message,
    };
  }

  if (error instanceof Error) {
    return {
      status: 500,
      message: error.message,
    };
  }

  return {
    status: 500,
    message: "Internal server error",
  };
};

export const getGatcDashboardController = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  try {
    const userId = getUserId(req);

    const data = await getGatcDashboardService(userId);

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    const result = getErrorResponse(error);

    return res.status(result.status).json({
      success: false,
      message: result.message,
    });
  }
};

export const registerGatcOfficerController = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  try {
    const userId = getUserId(req);

    const { fullName, email, mobile, employeeId } = req.body ?? {};

    const data = await registerGatcOfficerService({
      principalUserId: userId,
      fullName: String(fullName ?? ""),
      email: String(email ?? ""),
      mobile: String(mobile ?? ""),
      employeeId: String(employeeId ?? ""),
    });

    return res.status(201).json({
      success: true,
      message: "GATC officer registered successfully",
      data,
    });
  } catch (error) {
    const result = getErrorResponse(error);

    return res.status(result.status).json({
      success: false,
      message: result.message,
    });
  }
};

export const getGatcSettingsController = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  try {
    const userId = getUserId(req);

    const data = await getGatcSettingsService(userId);

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    const result = getErrorResponse(error);

    return res.status(result.status).json({
      success: false,
      message: result.message,
    });
  }
};
