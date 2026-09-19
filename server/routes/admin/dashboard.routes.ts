import { Router } from "express";
import {
  getAdminDashboard,
  getAdminAllocations,
  exportAdminDashboard,
} from "../../controllers/admin/dashboard.controller";

export const router = Router();

///api/admin/dashboard
router.get("/dashboard", getAdminDashboard);
router.get("/allocations", getAdminAllocations);
router.get("/dashboard/export", exportAdminDashboard);
