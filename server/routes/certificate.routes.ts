import { Router } from "express";
import { getCertificates } from "../controllers/certificate.controller";

export const router = Router();

// GET /api/certificates
router.get("/:userId", getCertificates);
