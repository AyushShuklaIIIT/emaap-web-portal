import express from "express";
import {
  getInstrumentSearch,
  getVerifiedInstruments,
} from "../controllers/instrument.controller";

export const router = express.Router();

// /api/instrument
router.get("/:userId", getVerifiedInstruments);
router.get("/:userId/:input/search", getInstrumentSearch);
