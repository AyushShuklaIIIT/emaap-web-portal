import { Router } from "express";
import {
  getPendencyQueue,
  approvePendencyRoute,
  manualOverridePendencyRoute,
  bulkApprovePendencyRoutes,
} from "../../controllers/admin/pendency.controller";

export const router = Router();

// /api/admin/pendency
router.get("/", getPendencyQueue);
router.patch("/:appId/approve-route", approvePendencyRoute);
router.patch("/:appId/manual-override", manualOverridePendencyRoute);
router.post("/bulk-approve", bulkApprovePendencyRoutes);
