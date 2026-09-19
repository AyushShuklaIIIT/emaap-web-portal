import {
  getApplicationsDashboard,
  getBusinessDashboard,
} from "../../controllers/business/dashboard.controller";
import express from "express";

export const router = express.Router();

// /api/dashboard
router.get("/:userId", getBusinessDashboard);
router.get("/:userId/applications", getApplicationsDashboard);
