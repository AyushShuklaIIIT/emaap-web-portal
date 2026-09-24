import { Router } from "express";
import {
  getStateAdminDashboard,
  getStateAdminAllocations,
  exportStateAdminDashboard,
  getStateAdminGatcsList,
} from "../../../controllers/admin/state/stateAdmin.controller";
import { requireAuth } from "../../../middleware/require-auth";

export const router = Router();

router.use(requireAuth);

// /api/state-admin
router.get("/dashboard", getStateAdminDashboard);
router.get("/allocations", getStateAdminAllocations);
router.get("/gatcs", getStateAdminGatcsList);
router.get("/dashboard/export", exportStateAdminDashboard);
