import express from "express";
import { requireAdmin } from "../middleware/require-admin";
import {
  approveRegistration,
  listPendingRegistrations,
  rejectRegistration,
} from "../controllers/adminReviewController";

export const adminReviewRouter = express.Router();
adminReviewRouter.use(requireAdmin);
adminReviewRouter.get("/registrations/pending", listPendingRegistrations);
adminReviewRouter.post("/registrations/:id/approve", approveRegistration);
adminReviewRouter.post("/registrations/:id/reject", rejectRegistration);
