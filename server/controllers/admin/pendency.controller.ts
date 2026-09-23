import { Request, Response } from "express";
import { AppError } from "../../errors/AppError";
import {
  getPendencyQueueService,
  approvePendencyRouteService,
  manualOverridePendencyRouteService,
  bulkApprovePendencyRoutesService,
} from "../../services/admin/pendency.service";
import { emitAdminAllocationsUpdate } from "../../socket/adminEvents";
import { emitRouteAssigned } from "../../socket/routeEvents";

export const getPendencyQueue = async (req: Request, res: Response) => {
  try {
    const stateCode =
      typeof req.query.stateCode === "string" ? req.query.stateCode : "ALL";

    const slaStatus =
      typeof req.query.slaStatus === "string" ? req.query.slaStatus : "ALL";

    const pageRaw = typeof req.query.page === "string" ? req.query.page : "1";

    const limitRaw =
      typeof req.query.limit === "string" ? req.query.limit : "20";

    const page = Number(pageRaw);
    const limit = Number(limitRaw);

    if (!Number.isInteger(page) || page < 1) {
      return res.status(400).json({
        success: false,
        message: "Page must be a positive integer",
      });
    }

    if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
      return res.status(400).json({
        success: false,
        message: "Limit must be between 1 and 100",
      });
    }

    if (!["ALL", "BREACHED", "WITHIN_SLA"].includes(slaStatus)) {
      return res.status(400).json({
        success: false,
        message: "Invalid SLA status. Use ALL, BREACHED or WITHIN_SLA",
      });
    }

    const data = await getPendencyQueueService({
      stateCode: stateCode.toUpperCase(),
      slaStatus: slaStatus as "ALL" | "BREACHED" | "WITHIN_SLA",
      page,
      limit,
    });

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

    console.error("Get pendency queue error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch pendency queue",
    });
  }
};

export const approvePendencyRoute = async (req: Request, res: Response) => {
  try {
    const { appId } = req.params;

    if (!appId || typeof appId !== "string") {
      return res.status(400).json({
        success: false,
        message: "Application ID is required",
      });
    }

    const { gatcId, lmoId } = req.body;

    if ((gatcId && lmoId) || (!gatcId && !lmoId)) {
      throw new AppError(400, "Provide exactly one of gatcId or lmoId");
    }

    const result = await approvePendencyRouteService(appId, { gatcId, lmoId });
    const io = req.app.get("io");

    if (io) {
      emitRouteAssigned(io, {
        app_id: result.app_id,
        application_no: result.application_no,
        assigned_type: result.assigned_type,
        assigned_id: result.assigned_id,
        assigned_to: result.assigned_to,
        business_name: result.business_name,
        instrument_category: result.instrument_category,
        timestamp: new Date().toISOString(),
        serial_no: result.serial_no,
        model_no: result.model_no,
        previousCertificateUrl: result.previousCertificateUrl,
        manufacturerCertificateUrl: result.manufacturerCertificateUrl,
        error: result.error,
      });
      emitAdminAllocationsUpdate(io, "pendency_route_approved");
    }

    return res.status(200).json({
      success: true,
      data: result,
      message: "Route approved successfully",
    });
  } catch (error) {
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    }

    console.error("Approve pendency route error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to approve route",
    });
  }
};

export const manualOverridePendencyRoute = async (
  req: Request,
  res: Response,
) => {
  try {
    const { appId } = req.params;

    if (!appId || typeof appId !== "string") {
      return res.status(400).json({
        success: false,
        message: "Application ID is required",
      });
    }

    const { assigned_type, assigned_id } = req.body;

    if (assigned_type !== "LMO" && assigned_type !== "GATC") {
      return res.status(400).json({
        success: false,
        message: "assigned_type must be LMO or GATC",
      });
    }

    if (!assigned_id || typeof assigned_id !== "string") {
      return res.status(400).json({
        success: false,
        message: "assigned_id is required",
      });
    }

    const data = await manualOverridePendencyRouteService(
      appId,
      assigned_type,
      assigned_id,
    );

    const io = req.app.get("io");

    if (io) {
      emitRouteAssigned(io, {
        app_id: data.app_id,
        application_no: data.application_no,
        assigned_type: data.assigned_type,
        assigned_id: data.assigned_id,
        assigned_to: data.assigned_to,
        business_name: data.business_name,
        instrument_category: data.instrument_category,
        serial_no: data.serial_no,
        model_no: data.model_no,
        previousCertificateUrl: data.previousCertificateUrl,
        manufacturerCertificateUrl: data.manufacturerCertificateUrl,
        error: data.error,
        timestamp: new Date().toISOString(),
      });
      emitAdminAllocationsUpdate(io, "pendency_route_manually_overridden");
    }

    return res.status(200).json({
      success: true,
      data,
      message: "Route manually overridden successfully",
    });
  } catch (error) {
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    }

    console.error("Manual override route error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to override route",
    });
  }
};

export const bulkApprovePendencyRoutes = async (
  req: Request,
  res: Response,
) => {
  try {
    const { appIds } = req.body;

    if (!Array.isArray(appIds)) {
      return res.status(400).json({
        success: false,
        message: "appIds must be an array",
      });
    }

    if (appIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one application ID is required",
      });
    }

    if (appIds.length > 100) {
      return res.status(400).json({
        success: false,
        message: "A maximum of 100 applications can be approved at once",
      });
    }

    if (!appIds.every((id) => typeof id === "string")) {
      return res.status(400).json({
        success: false,
        message: "Every application ID must be a string",
      });
    }

    const data = await bulkApprovePendencyRoutesService(appIds);
    const io = req.app.get("io");

    if (io) {
      for (const result of data.results) {
        if (
          result.success &&
          result.assigned_type &&
          result.assigned_id &&
          result.business_name &&
          result.instrument_category
        ) {
          emitRouteAssigned(io, {
            app_id: result.app_id,
            application_no: result.application_no,
            assigned_type: result.assigned_type,
            assigned_id: result.assigned_id,
            assigned_to: result.assigned_to,
            business_name: result.business_name,
            instrument_category: result.instrument_category,
            serial_no: result.serial_no ?? "",
            model_no: result.model_no ?? "",
            previousCertificateUrl: result.previousCertificateUrl ?? null,
            manufacturerCertificateUrl:
              result.manufacturerCertificateUrl ?? null,
            error: result.error ?? null,
            timestamp: new Date().toISOString(),
          });
        }
      }

      if (data.successful > 0) {
        emitAdminAllocationsUpdate(io, "bulk_pendency_routes_approved");
      }
    }

    return res.status(200).json({
      success: true,
      data,
      message: "Bulk route approval completed",
    });
  } catch (error) {
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    }

    console.error("Bulk approve pendency routes error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to bulk approve routes",
    });
  }
};
