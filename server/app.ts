import "dotenv/config";
import express from "express";
import crypto from "node:crypto";
import cors from "cors";
import { PrismaClient } from "./generated/prisma";
import type { Certificate } from "../client/hooks/useCertificates";
import { createServer as createHttpServer } from "node:http";
import { Server as SocketIOServer } from "socket.io";

import { router as uploadRouter } from "./routes/app.routes";
import { router as dashboardRouter } from "./routes/business/dashboard.routes";
import { router as adminDashboardRouter } from "./routes/admin/dashboard.routes";
import { router as instrumentRouter } from "./routes/business/instrument.routes";
import { router as paymentRouter } from "./routes/business/payment.routes";
import { router as verificationAppRouter } from "./routes/business/verificationApp.routes";
import { router as certificateRouter } from "./routes/business/certificate.routes";
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
  sealImageUrls: string[];
  hash: string;
  certificateId: string;
  verificationSignature?: string;
  status: string;
  tokenHash?: string;
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
  app.use("/api/admin", adminDashboardRouter);
  app.use("/api/instrument", instrumentRouter);
  app.use("/api/payment", paymentRouter);
  app.use("/api/verification", verificationAppRouter);
  app.use("/api/certificates", certificateRouter);
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
      console.log("Tanishq ne approve kar diya hai! Payload:", data);
      
      // Anti-replay attack check (300 seconds threshold)
      const nowMs = Date.now();
      const payloadMs = data.timeStamp ? (data.timeStamp / 1000) : nowMs; // convert microseconds to milliseconds
      
      if (Math.abs(nowMs - payloadMs) > 300000) {
        console.error("Replay attack detected: Timestamp expired", { nowMs, payloadMs });
        return socket.emit("error", { message: "Replay attack detected: Timestamp expired" });
      }

      const issueTimestamp = new Date().toISOString();
      const rawDataToHash = `${data.instrumentSerialNumber}|${data.lat},${data.long}|${issueTimestamp}|LMO-MP-1048|${data.token_hash}`;
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
        sealImageUrls: data.sealImageUrls || [],
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
            sealImageUrls: finalCertPayload.sealImageUrls,
            hash: finalCertPayload.hash,
            issueDate: new Date(finalCertPayload.issueDate),
            verificationSignature: finalCertPayload.verificationSignature,
            status: finalCertPayload.status || "APPROVED_CHECKLIST",
            tokenHash: finalCertPayload.token_hash || null,
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

  app.get("/api/certificates/:certificateId/download", async (req, res) => {
    try {
      const { certificateId } = req.params;
      const { prisma } = await import("./lib/prisma");
      const cert = await prisma.generatedCertificate.findUnique({
        where: { certificateId },
      });

      if (!cert) {
        return res.status(404).json({ error: "Certificate not found" });
      }

      if (cert.status === "FAILED_CHECKLIST") {
        return res.status(403).json({ error: "Cannot download rejected certificate." });
      }

      const { PDFDocument, rgb, StandardFonts } = await import("pdf-lib");
      const pdfDoc = await PDFDocument.create();
      const page = pdfDoc.addPage([595.28, 841.89]); // A4 size
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      const { width, height } = page.getSize();

      // Official Colors
      const navyBlue = rgb(11/255, 61/255, 145/255);
      const orange = rgb(249/255, 115/255, 22/255);
      const saffron = rgb(255/255, 153/255, 51/255);
      const white = rgb(1, 1, 1);
      const indiaGreen = rgb(19/255, 136/255, 8/255);
      const gray = rgb(0.5, 0.5, 0.5);
      const lightGray = rgb(0.97, 0.97, 0.97);
      const borderGray = rgb(0.9, 0.9, 0.9);
      const darkGray = rgb(0.15, 0.15, 0.15);

      // 1. Tricolor Banner at top
      const bannerHeight = 6;
      page.drawRectangle({ x: 0, y: height - bannerHeight, width, height: bannerHeight, color: saffron });
      page.drawRectangle({ x: 0, y: height - bannerHeight * 2, width, height: bannerHeight, color: white });
      page.drawRectangle({ x: 0, y: height - bannerHeight * 3, width, height: bannerHeight, color: indiaGreen });

      // 2. Govt Header
      page.drawText("GOVERNMENT OF INDIA", { x: width / 2 - 60, y: height - 50, size: 10, font: boldFont, color: gray });
      page.drawText("DEPARTMENT OF CONSUMER AFFAIRS", { x: width / 2 - 105, y: height - 65, size: 10, font: boldFont, color: gray });

      // 3. Title Section
      page.drawText("VERIFIED LEGAL METROLOGY", { x: 50, y: height - 120, size: 22, font: boldFont, color: navyBlue });
      page.drawText("OFFICIAL VERIFICATION CERTIFICATE", { x: 50, y: height - 140, size: 11, font: boldFont, color: orange });
      
      // Divider line
      page.drawLine({ start: { x: 50, y: height - 155 }, end: { x: width - 50, y: height - 155 }, thickness: 1, color: borderGray });

      // 4. Details Box
      const boxY = height - 280;
      page.drawRectangle({ x: 50, y: boxY, width: width - 100, height: 110, color: lightGray, borderColor: borderGray, borderWidth: 1 });
      
      page.drawText("Instrument Category", { x: 70, y: boxY + 85, size: 9, font: font, color: gray });
      page.drawText(cert.instrumentCategory || "N/A", { x: 70, y: boxY + 70, size: 14, font: boldFont, color: darkGray });

      page.drawText("Serial Number", { x: 300, y: boxY + 85, size: 9, font: font, color: gray });
      page.drawText(cert.instrumentSerialNumber, { x: 300, y: boxY + 70, size: 14, font: boldFont, color: darkGray });

      page.drawText("Certificate ID", { x: 70, y: boxY + 35, size: 9, font: font, color: gray });
      page.drawText(cert.certificateId, { x: 70, y: boxY + 20, size: 11, font: font, color: darkGray });

      page.drawText("Issue Date", { x: 300, y: boxY + 35, size: 9, font: font, color: gray });
      page.drawText(new Date(cert.issueDate).toLocaleString(), { x: 300, y: boxY + 20, size: 11, font: boldFont, color: darkGray });

      // 5. Cryptographic Hashes Section
      let currentY = boxY - 30;
      page.drawText("CRYPTOGRAPHIC HASH", { x: 50, y: currentY, size: 9, font: boldFont, color: gray });
      currentY -= 25;
      page.drawRectangle({ x: 50, y: currentY, width: width - 100, height: 20, color: white, borderColor: borderGray, borderWidth: 1 });
      page.drawText(cert.hash, { x: 60, y: currentY + 6, size: 9, font: font, color: navyBlue });

      if (cert.tokenHash) {
        currentY -= 30;
        page.drawText("DIGITAL SIGNATURE (TOKEN HASH)", { x: 50, y: currentY, size: 9, font: boldFont, color: gray });
        currentY -= 25;
        page.drawRectangle({ x: 50, y: currentY, width: width - 100, height: 20, color: white, borderColor: borderGray, borderWidth: 1 });
        page.drawText(cert.tokenHash, { x: 60, y: currentY + 6, size: 9, font: font, color: navyBlue });
      }

      // 6. Seal Image
      currentY -= 40;
      page.drawText("Live Physical Seal Evidence:", { x: 50, y: currentY, size: 14, font: boldFont, color: navyBlue });
      
      if (cert.sealImageUrls && cert.sealImageUrls.length > 0) {
        let imageUrl = cert.sealImageUrls[0];
        if (imageUrl.startsWith("http://")) {
          imageUrl = imageUrl.replace("http://", "https://");
        }
        try {
          const imgResponse = await fetch(imageUrl);
          const imgBuffer = await imgResponse.arrayBuffer();
          
          let img;
          if (imageUrl.toLowerCase().endsWith('.png')) {
            img = await pdfDoc.embedPng(imgBuffer);
          } else {
            img = await pdfDoc.embedJpg(imgBuffer);
          }

          // Scale image to fit nicely
          const maxImgWidth = width - 100;
          const maxImgHeight = 250;
          let imgDims = img.scale(1);
          
          if (imgDims.width > maxImgWidth || imgDims.height > maxImgHeight) {
            const scaleFactor = Math.min(maxImgWidth / imgDims.width, maxImgHeight / imgDims.height);
            imgDims = img.scale(scaleFactor);
          }

          currentY -= (imgDims.height + 15);
          
          // Image border
          page.drawRectangle({
            x: 48, y: currentY - 2,
            width: imgDims.width + 4, height: imgDims.height + 4,
            borderColor: orange, borderWidth: 2
          });

          page.drawImage(img, {
            x: 50,
            y: currentY,
            width: imgDims.width,
            height: imgDims.height,
          });
        } catch (imgError) {
          console.error("Failed to embed image in PDF:", imgError);
          currentY -= 30;
          page.drawText("[Seal Image could not be loaded into PDF]", { x: 50, y: currentY, size: 10, font, color: orange });
        }
      }

      // Footer
      page.drawRectangle({ x: 0, y: 0, width, height: 40, color: navyBlue });
      page.drawText("This is a cryptographically secured verification record. Any modification invalidates this certificate.", {
        x: 50, y: 15, size: 9, font: font, color: white
      });

      const pdfBytes = await pdfDoc.save();

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="Certificate-${cert.certificateId.substring(0,8)}.pdf"`);
      res.send(Buffer.from(pdfBytes));
    } catch (error) {
      console.error("Failed to generate PDF:", error);
      res.status(500).json({ success: false, error: "Failed to generate PDF" });
    }
  });

  return { app, httpServer, io };
}
