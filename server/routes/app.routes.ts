import multer from "multer";
import express from "express";
import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";

export const router = express.Router();

cloudinary.config();

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
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

interface Result {
  applicationId: string;
  manufacturerFileUrl: string;
  prevCertificateFileUrl?: string | null;
}

// /api
router.post(
  "/upload",
  upload.fields([
    { name: "manufacturerFile", maxCount: 1 },
    { name: "prevCertificateFile", maxCount: 1 },
  ]),
  (req, res) => {
    if (!req.files) {
      console.log("no file uploaded");
      return res.status(400).json({
        success: false,
        message: "No file uploaded",
      });
    }

    const applicationId: string = req.body.applicationId;
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };

    if (!files?.["manufacturerFile"] || files["manufacturerFile"].length === 0) {
      console.log("Manufacturer file is required");
      return res.status(400).json({
        success: false,
        message: "Manufacturer file is required",
      });
    }

    // With multer-storage-cloudinary, req.file.path holds the Cloudinary URL
    const manufacturerFileUrl = files["manufacturerFile"][0].path;

    let prevCertificateFileUrl = null;
    if (files["prevCertificateFile"] && files["prevCertificateFile"].length > 0) {
      prevCertificateFileUrl = files["prevCertificateFile"][0].path;
    }

    const io = req.app.get("io");
    const result: Result = {
      applicationId,
      manufacturerFileUrl,
      prevCertificateFileUrl,
    };
    if (io) {
      io.emit("fileUploaded", result);
      console.log(`Files uploaded for application: `, result);
    }

    res.json({
      success: true,
      message: "Sent Successful",
    });
  },
);
