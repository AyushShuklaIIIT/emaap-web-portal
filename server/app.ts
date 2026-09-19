import "dotenv/config";
import express from "express";
import crypto from "node:crypto";
import cors from "cors";
import { handleDemo } from "./routes/demo";
import { createServer as createHttpServer } from "node:http";
import { Server as SocketIOServer } from "socket.io";

import { router as uploadRouter } from "./routes/app.routes";
import { router as dashboardRouter } from "./routes/dashboard.routes";
import { router as instrumentRouter } from "./routes/instrument.routes";
import { router as gatewayRouter } from "./routes/gateway.routes";
import { aadhaarRouter } from "./routes/aadhaar.routes";
import { authRouter } from "./routes/auth.routes";
import { registrationRouter } from "./routes/registration.routes";
import { adminReviewRouter } from "./routes/admin-review.routes";
import { gstnRouter } from "./routes/gstn.routes";
import { panRouter } from "./routes/pan.routes";
import { nswsRouter } from "./routes/nsws.routes";
import path from "node:path";
import { correlationIdMiddleware } from "./middleware/correlation-id";
import {
  createCertificateSignature,
  verifyCertificateSignature,
} from "./services/qr-payload.service";

interface CertificateData {
  instrumentSerialNumber: string;
  instrumentCategory?: string;
  lat: number;
  long: number;
  sealImageBase64: string;
  hash: string;
  certificateId: string;
  verificationSignature?: string;
}

export function createServer() {
  const app = express();
  const httpServer = createHttpServer(app);
  const allowedOrigins = process.env.FRONTEND_URL?.split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
  const corsOrigin = allowedOrigins?.length ? allowedOrigins : "*";

  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: corsOrigin,
      methods: ["GET", "POST"],
    },
  });

  app.set("io", io);

  // Middleware
  app.use(correlationIdMiddleware);
  app.use(cors({ origin: corsOrigin }));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));
  app.use("/api", uploadRouter);

  app.use("/api/dashboard", dashboardRouter);
  app.use("/api/instrument", instrumentRouter);
  app.use("/api/gateway", gatewayRouter);
  app.use("/api/v1/gateway/aadhaar", aadhaarRouter);
  app.use("/api/v1/gateway/gstn", gstnRouter);
  app.use("/api/v1/gateway/pan", panRouter);
  app.use("/api/v1/auth", authRouter);
  app.use("/api/v1/auth", registrationRouter);
  app.use("/api/v1/admin", adminReviewRouter);
  app.use("/api/v1/nsws", nswsRouter);

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
        certificateId: crypto.randomUUID(),
        issueDate: issueTimestamp,
        hash: realHash,
      };
      finalCertPayload.verificationSignature = createCertificateSignature(
        finalCertPayload.certificateId,
        finalCertPayload.hash,
      );
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

    const signature = typeof req.query.sig === "string" ? req.query.sig : "";
    if (
      !latestCertificate ||
      !signature ||
      !verifyCertificateSignature(latestCertificate.hash, signature)
    ) {
      return res.status(403).send("Invalid or missing certificate signature.");
    }

    console.log("Accepted certificate data: ", latestCertificate);

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

    if (!latestCertificate.instrumentCategory) {
      console.log(`Instrument Category not found`);
    }

    if (!latestCertificate.instrumentSerialNumber) {
      console.log(`Instrument Serial Number not found`);
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
          <p><strong>Instrument:</strong> ${latestCertificate.instrumentCategory}</p>
          <p><strong>Serial Number:</strong> ${latestCertificate.instrumentSerialNumber}</p>
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
    const certificatesList = Array.from(certificates.values()).map((certificate) => ({
      ...certificate,
      verificationSignature: createCertificateSignature(
        certificate.certificateId,
        certificate.hash,
      ),
    }));

    res.json(certificatesList);
  });

  return { app, httpServer, io };
}
