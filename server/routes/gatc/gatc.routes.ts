import { Router } from "express";

import {
  getGatcDashboardController,
  getGatcSettingsController,
  registerGatcOfficerController,
} from "../../controllers/gatc/gatc.controller.js";
import { requireAuth } from "../../middleware/require-auth.js";

export const router = Router();

router.use(requireAuth);
router.get("/dashboard", getGatcDashboardController);
router.post("/register-officer", registerGatcOfficerController);
router.get("/settings", getGatcSettingsController);
