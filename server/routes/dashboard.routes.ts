import express from "express";
import {
  getApplicationsDashboard,
  getBusinessDashboard,
} from "../controllers/dashboard.controller";

export const router = express.Router();

// /api/dashboard
router.get("/:userId", getBusinessDashboard);
router.get("/:userId/applications", getApplicationsDashboard);
