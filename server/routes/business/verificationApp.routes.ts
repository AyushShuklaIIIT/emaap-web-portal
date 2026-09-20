import express from "express";
import {
  getVerificationApp,
  postVerificationApp,
} from "../../controllers/business/verificationApp.controller";

export const router = express.Router();

// /api/verification
router.get("/:userId", getVerificationApp);
router.post("/:userId", postVerificationApp);
