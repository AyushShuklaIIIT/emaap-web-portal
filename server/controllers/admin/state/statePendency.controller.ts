import { Request, Response } from "express";
import { AppError } from "../../../errors/AppError";
import {
  getStatePendencyQueueService,
  approveStatePendencyRouteService,
  manualOverrideStatePendencyRouteService,
  bulkApproveStatePendencyRoutesService,
} from "../../../services/admin/state/statePendency.service";
import { emitAdminAllocationsUpdate } from "../../../socket/adminEvents";
import { emitRouteAssigned } from "../../../socket/routeEvents";
import { prisma } from "../../../lib/prisma";

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

export const getStatePendencyQueue = async (req: Request, res: Response) => {
  try {
    const stateCode = await getStateCodeFromAuth(req);
    const district =
      typeof req.query.district === "string" ? req.query.district : undefined;
    const slaStatus =
      typeof req.query.slaStatus === "string" ? req.query.slaStatus : "ALL";
    const page = Number(req.query.page || "1");
    const limit = Number(req.query.limit || "20");

    if (!Number.isInteger(page) || page < 1)
      throw new AppError(400, "Page must be a positive integer");
    if (!Number.isInteger(limit) || limit < 1 || limit > 100)
      throw new AppError(400, "Limit must be between 1 and 100");
    if (!["ALL", "BREACHED", "WITHIN_SLA"].includes(slaStatus))
      throw new AppError(400, "Invalid SLA status");

    const data = await getStatePendencyQueueService({
      stateCode,
      district,
      slaStatus: slaStatus as "ALL" | "BREACHED" | "WITHIN_SLA",
      page,
      limit,
    });

    return res.status(200).json({ success: true, data });
  } catch (error) {
    if (error instanceof AppError)
      return res
        .status(error.statusCode)
        .json({ success: false, message: error.message });
    return res.status(500).json({
      success: false,
      message: "Failed to fetch state pendency queue",
    });
  }
};

export const approveStatePendencyRoute = async (
  req: Request,
  res: Response,
) => {
  try {
    const stateCode = await getStateCodeFromAuth(req);
    const appId = req.params.appId as string;
    const { gatcId, lmoId } = req.body;

    if (!appId) throw new AppError(400, "Application ID is required");
    if ((gatcId && lmoId) || (!gatcId && !lmoId))
      throw new AppError(400, "Provide exactly one of gatcId or lmoId");

    const result = await approveStatePendencyRouteService(stateCode, appId, {
      gatcId,
      lmoId,
    });
    const io = req.app.get("io");

    if (io) {
      emitRouteAssigned(io, { ...result, timestamp: new Date().toISOString() });
      emitAdminAllocationsUpdate(io, "pendency_route_approved");
    }

    return res.status(200).json({
      success: true,
      data: result,
      message: "Route approved successfully",
    });
  } catch (error) {
    if (error instanceof AppError)
      return res
        .status(error.statusCode)
        .json({ success: false, message: error.message });
    return res
      .status(500)
      .json({ success: false, message: "Failed to approve route" });
  }
};

export const manualOverrideStatePendencyRoute = async (
  req: Request,
  res: Response,
) => {
  try {
    const stateCode = await getStateCodeFromAuth(req);
    const appId = req.params.appId as string;
    const { assigned_type, assigned_id } = req.body;

    if (!appId) throw new AppError(400, "Application ID is required");
    if (assigned_type !== "LMO" && assigned_type !== "GATC")
      throw new AppError(400, "assigned_type must be LMO or GATC");
    if (!assigned_id) throw new AppError(400, "assigned_id is required");

    const data = await manualOverrideStatePendencyRouteService(
      stateCode,
      appId,
      assigned_type,
      assigned_id,
    );
    const io = req.app.get("io");

    if (io) {
      emitRouteAssigned(io, { ...data, timestamp: new Date().toISOString() });
      emitAdminAllocationsUpdate(io, "pendency_route_manually_overridden");
    }

    return res.status(200).json({
      success: true,
      data,
      message: "Route manually overridden successfully",
    });
  } catch (error) {
    if (error instanceof AppError)
      return res
        .status(error.statusCode)
        .json({ success: false, message: error.message });
    return res
      .status(500)
      .json({ success: false, message: "Failed to override route" });
  }
};

export const bulkApproveStatePendencyRoutes = async (
  req: Request,
  res: Response,
) => {
  try {
    const stateCode = await getStateCodeFromAuth(req);
    const { appIds } = req.body;

    if (!Array.isArray(appIds) || appIds.length === 0)
      throw new AppError(400, "Valid appIds array is required");
    if (appIds.length > 100)
      throw new AppError(
        400,
        "Maximum of 100 applications can be approved at once",
      );

    const data = await bulkApproveStatePendencyRoutesService(stateCode, appIds);
    const io = req.app.get("io");

    if (io) {
      for (const result of data.results) {
        if (result.success) {
          emitRouteAssigned(io, {
            ...(result as any),
            timestamp: new Date().toISOString(),
          });
        }
      }
      if (data.successful > 0)
        emitAdminAllocationsUpdate(io, "bulk_pendency_routes_approved");
    }

    return res
      .status(200)
      .json({ success: true, data, message: "Bulk route approval completed" });
  } catch (error) {
    if (error instanceof AppError)
      return res
        .status(error.statusCode)
        .json({ success: false, message: error.message });
    return res
      .status(500)
      .json({ success: false, message: "Failed to bulk approve routes" });
  }
};
