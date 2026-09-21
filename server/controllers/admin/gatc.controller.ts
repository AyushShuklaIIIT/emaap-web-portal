import { Request, Response } from "express";
import {
  changeGatcStatusService,
  getDashboardService,
  getGatcProfileService,
  getGatcsService,
  renewGatcService,
} from "../../services/admin/gatc.service";

export const getDashboard = async (req: Request, res: Response) => {
  try {
    const dashboard = await getDashboardService();

    return res.status(200).json({
      success: true,
      data: dashboard,
    });
  } catch (error) {
    console.error("GET GATC dashboard error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch GATC dashboard",
    });
  }
};

export const getGatcs = async (req: Request, res: Response) => {
  try {
    const { search, status, page, limit } = req.query;

    const result = await getGatcsService({
      search: search as string | undefined,
      status: status as any,
      page: Number(page) || 1,
      limit: Number(limit) || 10,
    });

    return res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error("GET GATCs error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch GATCs",
    });
  }
};

export const getGatcProfile = async (req: Request, res: Response) => {
  try {
    const { gatcId } = req.params;

    if (!gatcId || typeof gatcId !== "string") {
      return res.status(400).json({
        success: false,
        message: "Invalid GATC ID",
      });
    }

    const gatc = await getGatcProfileService(gatcId);

    return res.status(200).json({
      success: true,
      data: gatc,
    });
  } catch (error) {
    console.error("GET GATC profile error:", error);

    if (error instanceof Error && error.message === "GATC not found") {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to fetch GATC profile",
    });
  }
};

export const authorizeGatc = async (req: Request, res: Response) => {
  try {
    const gatc = await authorizeGatcService(req.body);

    return res.status(201).json({
      success: true,
      message: "GATC authorized successfully",
      data: gatc,
    });
  } catch (error) {
    console.error("Authorize GATC error:", error);

    return res.status(400).json({
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to authorize GATC",
    });
  }
};

export const changeGatcStatus = async (req: Request, res: Response) => {
  try {
    const { gatcId } = req.params;

    if (!gatcId || typeof gatcId !== "string") {
      return res.status(400).json({
        success: false,
        message: "Invalid GATC ID",
      });
    }

    const gatc = await changeGatcStatusService(gatcId, req.body.status);

    return res.status(200).json({
      success: true,
      message: "GATC status updated successfully",
      data: gatc,
    });
  } catch (error) {
    console.error("Change GATC status error:", error);

    return res.status(400).json({
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to update GATC status",
    });
  }
};

export const renewGatc = async (req: Request, res: Response) => {
  try {
    const { gatcId } = req.params;

    if (!gatcId || typeof gatcId !== "string") {
      return res.status(400).json({
        success: false,
        message: "Invalid GATC ID",
      });
    }

    const data = {
      ...req.body,
      valid_from: new Date(req.body.valid_from),
      valid_to: new Date(req.body.valid_to),
    };

    const gatc = await renewGatcService(gatcId, data);

    return res.status(200).json({
      success: true,
      message: "GATC renewed successfully",
      data: gatc,
    });
  } catch (error) {
    console.error("Renew GATC error:", error);

    return res.status(400).json({
      success: false,
      message: error instanceof Error ? error.message : "Failed to renew GATC",
    });
  }
};

function authorizeGatcService(body: any) {
  throw new Error("Function not implemented."); // still have to make
}
