import express from "express";
import {
  getInstrumentSearch,
  getVerifiedInstruments,
  getInstrumentHistory,
} from "../../controllers/business/instrument.controller";

export const router = express.Router();

// /api/instrument
router.get("/history/:applicationId", getInstrumentHistory);
router.get("/:userId", getVerifiedInstruments);
router.get("/:userId/:input/search", getInstrumentSearch);
