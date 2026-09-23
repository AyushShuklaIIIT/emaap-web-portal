import { Router } from "express";

import {
  createFeeSchedule,
  getFeeSchedules,
  getInstrumentCategories,
  getInstrumentCategoryOptions,
  getStates,
  createInstrumentCategory,
  updateFeeSchedule,
  updateInstrumentCategory,
} from "../../controllers/admin/masterData.controller";

export const router = Router();

router.get("/fee-schedules", getFeeSchedules);
router.post("/fee-schedules", createFeeSchedule);
router.put("/fee-schedules/:id", updateFeeSchedule);
router.get("/states", getStates);
router.get("/instrument-categories", getInstrumentCategories);
router.get("/instrument-categories/options", getInstrumentCategoryOptions);
router.post("/instrument-categories", createInstrumentCategory);
router.put("/instrument-categories/:id", updateInstrumentCategory);
