import { Router } from "express";
import {
  exportFinancialReportController,
  getFinancialReportController,
} from "../../controllers/admin/financial.controller";

export const router = Router();

// /api/admin/financial
router.get("/", getFinancialReportController);
router.get("/export", exportFinancialReportController);
