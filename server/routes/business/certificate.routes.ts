import { getCertificates } from "../../controllers/business/certificate.controller";
import { Router } from "express";

export const router = Router();

// GET /api/certificates
router.get("/:userId", getCertificates);
