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
  sealImageUrl: string;
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
  
  // Dynamically allow the requesting origin during local network testing to prevent CORS issues on mobile/LAN
  const corsOrigin = function (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) {
    if (!origin) return callback(null, true);
    
    // Always allow localhost and local network IPs for testing
    if (origin.includes("localhost") || origin.includes("192.168.") || origin.includes("10.0.") || origin.includes("172.")) {
      return callback(null, true);
    }
    
    if (allowedOrigins && allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    
    callback(null, false);
  };

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

    socket.on("inspection_approved", async (data) => {
      console.log("Tanishq ne approve kar diya hai! Aage jaane do...");
      const issueTimestamp = new Date().toISOString();
      const rawDataToHash = `${data.instrumentSerialNumber}|${data.lat},${data.long}|${issueTimestamp}|LMO-MP-1048|${data.sealImageUrl}`;
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

      try {
        const { prisma } = await import("./lib/prisma");
        await prisma.generatedCertificate.create({
          data: {
            certificateId: finalCertPayload.certificateId,
            instrumentCategory: finalCertPayload.instrumentCategory,
            instrumentSerialNumber: finalCertPayload.instrumentSerialNumber,
            lat: finalCertPayload.lat,
            long: finalCertPayload.long,
            sealImageUrl: finalCertPayload.sealImageUrl,
            hash: finalCertPayload.hash,
            issueDate: new Date(finalCertPayload.issueDate),
            verificationSignature: finalCertPayload.verificationSignature,
          }
        });
        
        io.emit("certificate_generated", finalCertPayload);
      } catch (error) {
        console.error("Failed to save certificate to database:", error);
      }
    });
  });

  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });

  app.get("/api/demo", handleDemo);

  app.get("/api/verify/:certificateId", async (req, res) => {
    const { certificateId } = req.params;

    const { prisma } = await import("./lib/prisma");
    const latestCertificate = await prisma.generatedCertificate.findUnique({
      where: { certificateId },
    });

    const signature = typeof req.query.sig === "string" ? req.query.sig : "";
    if (
      !latestCertificate ||
      !signature ||
      !verifyCertificateSignature(latestCertificate.hash, signature)
    ) {
      return res.status(403).json({ success: false, error: "Invalid or missing certificate signature." });
    }

    console.log("Accepted certificate data: ", latestCertificate);
    res.json({ success: true, certificate: latestCertificate });
  });

  app.get("/api/certificates", async (_req, res) => {
    try {
      const { prisma } = await import("./lib/prisma");
      const certificatesList = await prisma.generatedCertificate.findMany({
        orderBy: { issueDate: 'desc' }
      });
      res.json(certificatesList);
    } catch (error) {
      console.error("Failed to list certificates:", error);
      res.status(500).json({ success: false, error: "Database error" });
    }
  });

  return { app, httpServer, io };
}
