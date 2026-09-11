import "dotenv/config";
import express from "express";
import crypto from "node:crypto";
import cors from "cors";
import { handleDemo } from "./routes/demo";
import { createServer as createHttpServer } from "node:http";
import { Server as SocketIOServer } from "socket.io";
import { router as uploadRouter } from "./routes/app.routes";

interface CertificateData {
  instrumentSerialNumber: string;
  instrumentCategory?: string;
  lat: number;
  long: number;
  sealImageBase64: string;
  hash: string;
  certificateId: string;
}

export function createServer() {
  const app = express();
  const httpServer = createHttpServer(app);

  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  app.set("io", io);

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use("/uploads", express.static("uploads"));
  app.use("/api", uploadRouter);

  const certificates = new Map<string, CertificateData>();

  io.on("connection", (socket) => {
    console.log(`socket connected:${socket.id}`);

    socket.on("msg", (data) => {
      console.log(`Recieved data:${JSON.stringify(data)}`);
      socket.emit("reply", "Whatup");
    });

    socket.on("data", (data) => {
      console.log("Recieved data:", data);
      socket.broadcast.emit("message", data);
    });

    socket.on("disconnect", (reason) => {
      console.log(reason);
    });

    socket.on("inspection_approved", (data) => {
      console.log("Tanishq ne approve kar diya hai! Aage jaane do...");
      const issueTimestamp = new Date().toISOString();
      const rawDataToHash = `${data.instrumentSerialNumber}|${data.lat},${data.long}|${issueTimestamp}|LMO-MP-1048|${data.sealImageBase64}`;
      const realHash = crypto
        .createHash("sha256")
        .update(rawDataToHash)
        .digest("hex");
      console.log("Generated Cryptographic Hash:", realHash);

      const finalCertPayload = {
        ...data,
        certificateId: `CERT-${crypto.randomUUID()}`,
        issueDate: issueTimestamp,
        hash: realHash,
      };
      certificates.set(finalCertPayload.certificateId, finalCertPayload);

      io.emit("certificate_generated", finalCertPayload);
    });
  });

  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });

  app.get("/api/demo", handleDemo);

  app.get("/verify/:certificateId", (req, res) => {
    const { certificateId } = req.params;

    const latestCertificate: CertificateData | undefined =
      certificates.get(certificateId);

    if (!latestCertificate) {
      return res
        .status(404)
        .send(
          "<h2 style='text-align:center; font-family:sans-serif; margin-top:50px;'>No certificate generated yet.</h2>",
        );
    }

    // Safely check and format the Base64 string
    let imageSrc = latestCertificate.sealImageBase64 || "";
    if (imageSrc && !imageSrc.startsWith("data:image/")) {
      imageSrc = `data:image/jpeg;base64,${imageSrc}`;
    }

    const htmlPage = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>eMaap Verification</title>
        <style>
          body { font-family: sans-serif; padding: 20px; text-align: center; background-color: #F5F7FA; color: #1A1A2E; }
          .card { background: white; padding: 20px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); border-top: 4px solid #1E8E3E; }
          .success { color: #1E8E3E; font-size: 24px; font-weight: bold; margin-bottom: 10px; }
          .hash { font-family: monospace; background: #EEF0F3; padding: 10px; border-radius: 6px; font-size: 12px; word-break: break-all; }
          img { max-width: 100%; border-radius: 8px; margin-top: 15px; border: 2px solid #0B3D91; }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="success">✅ VERIFIED LEGAL METROLOGY</div>
          <p><strong>Instrument:</strong> ${latestCertificate.instrumentCategory || "CNG Dispenser"}</p>
          <p><strong>Serial Number:</strong> ${latestCertificate.instrumentSerialNumber || "SN-8849201"}</p>
          <p><strong>Certificate ID:</strong> ${latestCertificate.certificateId}</p>
          
          <div style="text-align: left; margin-top: 20px;">
            <p style="font-size: 14px; font-weight: bold; color: #5C5C70;">CRYPTOGRAPHIC HASH:</p>
            <div class="hash">${latestCertificate.hash}</div>
          </div>
  
          <h3 style="margin-top: 25px; color: #0B3D91;">Live Physical Seal Evidence:</h3>
          <!-- Updated to use the sanitized imageSrc -->
          <img src="${imageSrc}" alt="Tamper Seal Evidence" />
        </div>
      </body>
      </html>
    `;

    res.send(htmlPage);
  });

  app.get("/api/certificates", (_req, res) => {
    const certificatesList = Array.from(certificates.values());

    res.json(certificatesList);
  });

  return { app, httpServer, io };
}
