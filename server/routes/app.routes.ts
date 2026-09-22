import multer from "multer";
import express from "express";
import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";

export const router = express.Router();

cloudinary.config();

const storage = new CloudinaryStorage({
  cloudinary,
  params: async (_req, file) => {
    const isPdf = file.mimetype === "application/pdf";

    return {
      folder: "emaap/applications",
      allowed_formats: ["pdf", "jpg", "jpeg", "png"],
      format: isPdf ? "pdf" : undefined,
    } as any;
  },
});

const upload = multer({ storage });

router.post(
  "/upload",
  upload.fields([
    { name: "manufacturerFile", maxCount: 1 },
    { name: "prevCertificateFile", maxCount: 1 },
  ]),
  (req, res) => {
    if (!req.files) {
      console.log("[UPLOAD] No file uploaded");

      return res.status(400).json({
        success: false,
        message: "No file uploaded",
      });
    }

    const applicationId = String(req.body.applicationId ?? "").trim();

    if (!applicationId) {
      console.log("[UPLOAD] Application ID is required");

      return res.status(400).json({
        success: false,
        message: "Application ID is required",
      });
    }

    const files = req.files as {
      [fieldname: string]: Express.Multer.File[];
    };

    if (!files["manufacturerFile"] || files["manufacturerFile"].length === 0) {
      console.log("[UPLOAD] Manufacturer file is required");

      return res.status(400).json({
        success: false,
        message: "Manufacturer file is required",
      });
    }

    const manufacturerFileUrl = files["manufacturerFile"][0].path;

    let prevCertificateFileUrl: string | null = null;

    if (
      files["prevCertificateFile"] &&
      files["prevCertificateFile"].length > 0
    ) {
      prevCertificateFileUrl = files["prevCertificateFile"][0].path;
    }

    const result = {
      applicationId,
      manufacturerFileUrl,
      prevCertificateFileUrl,
    };

    console.log("[UPLOAD] Files uploaded successfully:", result);

    return res.json({
      success: true,
      message: "Files uploaded successfully",
      applicationId,
      manufacturerFileUrl,
      prevCertificateFileUrl,
    });
  },
);
