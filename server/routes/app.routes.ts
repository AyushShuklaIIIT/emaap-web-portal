import express from "express";
import multer from "multer";

export const router = express.Router();
const upload = multer({ dest: "uploads/" });

router.post(
  "/upload",
  upload.fields([
    { name: "manufacturerFile", maxCount: 1 },
    { name: "prevCertificateFile", maxCount: 1 },
  ]),
  (req, res) => {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const applicationId = req.body.applicationId;
    const fileUrl = `http://localhost:8008/uploads/${req.file.filename}`;

    const io = req.app.get("io");

    if (io) {
      io.emit("fileUploaded", {
        id: applicationId,
        url: fileUrl,
      });
    }

    res.json({ success: true });
  },
);
