import express from "express";
import {
  createVerificationApplication,
  getVerificationCategories,
  getVerificationDistricts,
  getVerificationConditions,
  getVerificationApp,
  getVerificationFeeQuote,
  getVerificationMetadata,
  postVerificationApp,
} from "../../controllers/business/verificationApp.controller";

export const router = express.Router();

// /api/verification
router.get("/metadata", getVerificationMetadata);
router.get("/categories", getVerificationCategories);
router.get("/districts", getVerificationDistricts);
router.get("/conditions", getVerificationConditions);
router.post("/fee-quote", getVerificationFeeQuote);
router.post("/applications", createVerificationApplication);
router.get("/:userId", getVerificationApp);
router.post("/:userId", postVerificationApp);
export default router;
