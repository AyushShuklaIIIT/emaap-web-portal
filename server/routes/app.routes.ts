import express from "express";
import multer from "multer";

export const router = express.Router();
const upload = multer({ dest: "uploads/" });

interface Result {
  applicationId: string;
  manufacturerFileUrl: string;
  prevCertificateFileUrl?: string | null;
}

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

    if (
      !files ||
      !files["manufacturerFile"] ||
      files["manufacturerFile"].length === 0
    ) {
      console.log("Manufacturer file is required");
      console.log(files);
      return res.status(400).json({
        success: false,
        message: "Manufacturer file is required",
      });
    }

    const manufacturerFilename = files["manufacturerFile"][0].filename;
    const manufacturerFileUrl = `http://localhost:8008/uploads/${manufacturerFilename}`;

    let prevCertificateFileUrl = null;
    if (
      files["prevCertificateFile"] &&
      files["prevCertificateFile"].length > 0
    ) {
      const prevCertFilename = files["prevCertificateFile"][0].filename;
      prevCertificateFileUrl = `http://localhost:8008/uploads/${prevCertFilename}`;
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
