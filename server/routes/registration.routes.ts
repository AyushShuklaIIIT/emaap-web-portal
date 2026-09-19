import express from "express";
import multer from "multer";
import { mkdirSync } from "node:fs";
import path from "node:path";
import { MulterError } from "multer";
import { registerUser } from "../controllers/registrationController";

const uploadDirectory =
  process.env.REGISTRATION_UPLOAD_DIR ?? path.join(process.cwd(), "uploads", "registrations");
mkdirSync(uploadDirectory, { recursive: true });

const upload = multer({
  dest: uploadDirectory,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, callback) => {
    if (!["application/pdf", "image/jpeg", "image/png"].includes(file.mimetype)) {
      return callback(new MulterError("LIMIT_UNEXPECTED_FILE", file.fieldname));
    }
    return callback(null, true);
  },
});

export const registrationRouter = express.Router();
registrationRouter.post(
  "/register",
  upload.any(),
  registerUser,
);

registrationRouter.use((error: unknown, _req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (error instanceof MulterError) {
    return res.status(400).json({
      success: false,
      error: error.code === "LIMIT_FILE_SIZE"
        ? "Uploaded files must not exceed 5MB"
        : "Only PDF, JPEG, and PNG files are allowed",
    });
  }
  return next(error);
});
