import { Router } from "express";
import {
  getPaymentDashboard,
  getPaymentReceipt,
} from "../../controllers/business/payment.controller";

export const router = Router();

// /api/payment
router.get("/:userId", getPaymentDashboard);
router.get("/:userId/receipts/:receiptId", getPaymentReceipt);
