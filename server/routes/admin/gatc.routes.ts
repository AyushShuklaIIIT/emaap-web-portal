import express from "express";
import {
  authorizeGatc,
  changeGatcStatus,
  getDashboard,
  getGatcProfile,
  getGatcs,
  renewGatc,
} from "../../controllers/admin/gatc.controller";

export const router = express.Router();

router.get("/dashboard", getDashboard);
router.get("/", getGatcs);
router.get("/:gatcId", getGatcProfile);
router.post("/", authorizeGatc);
router.patch("/:gatcId/status", changeGatcStatus);
router.patch("/:gatcId/renew", renewGatc);
