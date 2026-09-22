import express from "express";
import {
  createVerificationApplication,
  getVerificationApp,
  getVerificationFeeQuote,
  getVerificationMetadata,
  postVerificationApp,
} from "../../controllers/business/verificationApp.controller";

export const router = express.Router();

// /api/verification
router.get("/metadata", getVerificationMetadata);
router.post("/fee-quote", getVerificationFeeQuote);
router.post("/applications", createVerificationApplication);
router.get("/:userId", getVerificationApp);
router.post("/:userId", postVerificationApp);
export default router;
