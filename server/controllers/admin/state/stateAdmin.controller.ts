import { Request, Response } from "express";
import { AppError } from "../../../errors/AppError";
import {
  exportStateAdminDashboardService,
  getStateAdminAllocationsService,
  getStateAdminDashboardService,
  getStateAdminGatcsService,
} from "../../../services/admin/state/stateAdmin.service";
import { prisma } from "../../../lib/prisma";

// Helper to extract state code from authenticated user
const getStateCodeFromAuth = async (req: Request): Promise<string> => {
  const reqUser = (req as any).user;
  if (!reqUser || !reqUser.user_id) {
    throw new AppError(401, "Authentication required");
  }

  const user = await prisma.user.findUnique({
    where: { user_id: reqUser.user_id },
    select: { jurisdiction_state: true },
  });

  if (
    !user ||
    !user.jurisdiction_state ||
    user.jurisdiction_state === "Central"
  ) {
    throw new AppError(
      403,
      "Access denied: User is not mapped to a valid state jurisdiction",
    );
  }
  return user.jurisdiction_state;
};

export const getStateAdminDashboard = async (req: Request, res: Response) => {
  try {
    const stateCode = await getStateCodeFromAuth(req);
    const financialYear =
      typeof req.query.financialYear === "string"
        ? req.query.financialYear
        : undefined;

    const data = await getStateAdminDashboardService(stateCode, financialYear);

    return res.status(200).json({ success: true, data });
  } catch (error) {
    if (error instanceof AppError) {
      return res
        .status(error.statusCode)
        .json({ success: false, message: error.message });
    }
    console.error("Get state admin dashboard error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Failed to fetch state dashboard" });
  }
};

export const getStateAdminAllocations = async (req: Request, res: Response) => {
  try {
    const stateCode = await getStateCodeFromAuth(req);
    const data = await getStateAdminAllocationsService(stateCode);

    return res.status(200).json({ success: true, data });
  } catch (error) {
    if (error instanceof AppError) {
      return res
        .status(error.statusCode)
        .json({ success: false, message: error.message });
    }
    console.error("Get state allocations error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Failed to fetch allocations" });
  }
};

export const exportStateAdminDashboard = async (
  req: Request,
  res: Response,
) => {
  try {
    const stateCode = await getStateCodeFromAuth(req);
    const financialYear =
      typeof req.query.financialYear === "string"
        ? req.query.financialYear
        : undefined;

    const { csv, fileName } = await exportStateAdminDashboardService(
      stateCode,
      financialYear,
    );

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);

    return res.status(200).send(csv);
  } catch (error) {
    if (error instanceof AppError) {
      return res
        .status(error.statusCode)
        .json({ success: false, message: error.message });
    }
    console.error("Export state dashboard error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Failed to export state report" });
  }
};

export const getStateAdminGatcsList = async (req: Request, res: Response) => {
  try {
    const stateCode = await getStateCodeFromAuth(req);
    const district = req.query.district as string | undefined;
    
    const gatcs = await getStateAdminGatcsService(stateCode, district);

    return res.status(200).json({ success: true, data: gatcs });
  } catch (error) {
    if (error instanceof AppError) {
      return res
        .status(error.statusCode)
        .json({ success: false, message: error.message });
    }
    console.error("Get state GATCs list error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Failed to fetch state GATCs" });
  }
};
