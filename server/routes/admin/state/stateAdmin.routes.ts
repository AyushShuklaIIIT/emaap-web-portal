import { Router } from "express";
import {
  getStatePendencyQueue,
  approveStatePendencyRoute,
  manualOverrideStatePendencyRoute,
  bulkApproveStatePendencyRoutes,
} from "../../../controllers/admin/state/statePendency.controller";

import {
  getStateAdminDashboard,
  getStateAdminAllocations,
  exportStateAdminDashboard,
  getStateAdminGatcsList,
} from "../../../controllers/admin/state/stateAdmin.controller";
import { requireAuth } from "../../../middleware/require-auth";
import {
  exportStateFinancialReportController,
  getStateFinancialReportController,
} from "../../../controllers/admin/state/stateFinancial.controller";

export const router = Router();

router.use(requireAuth);

// /api/state-admin
router.get("/dashboard", getStateAdminDashboard);
router.get("/allocations", getStateAdminAllocations);
router.get("/gatcs", getStateAdminGatcsList);
router.get("/dashboard/export", exportStateAdminDashboard);
router.get("/financial", getStateFinancialReportController);
router.get("/financial/export", exportStateFinancialReportController);
router.get("/pendency", getStatePendencyQueue);
router.patch("/pendency/:appId/approve-route", approveStatePendencyRoute);
router.patch(
  "/pendency/:appId/manual-override",
  manualOverrideStatePendencyRoute,
);
router.post("/pendency/bulk-approve", bulkApproveStatePendencyRoutes);
