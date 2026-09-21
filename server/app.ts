import "dotenv/config";
import express from "express";
import crypto from "node:crypto";
import cors from "cors";

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
import { router as adminPendencyRouter } from "./routes/admin/pendency.routes";
import { router as adminFinancialRouter } from "./routes/admin/financial.routes";
import { router as adminGatcRouter } from "./routes/admin/gatc.routes";
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
  const corsOrigin = function (
    origin: string | undefined,
    callback: (err: Error | null, allow?: boolean) => void,
  ) {
    if (!origin) return callback(null, true);

    // Always allow localhost and local network IPs for testing
    if (
      origin.includes("localhost") ||
      origin.includes("192.168.") ||
      origin.includes("10.0.") ||
      origin.includes("172.")
    ) {
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
  app.use("/api/admin/pendency", adminPendencyRouter);
  app.use("/api/admin/financial", adminFinancialRouter);
  app.use("/api/admin/gatcs", adminGatcRouter);
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

    socket.on("data", async (data) => {
      console.log("Recieved data:", data);
      socket.broadcast.emit("message", data);

      // Persist the incoming VerificationApp to DB to complete relational chain
      try {
        const { prisma } = await import("./lib/prisma");

        if (data.userId && data.instrumentSerialNumber) {
          // 1. Ensure BusinessProfile exists
          let business = await prisma.businessProfile.findUnique({
            where: { user_id: data.userId },
          });
          if (!business) {
            // Find a valid state ID (fallback to any if not found)
            let stateObj = await prisma.state.findFirst({
              where: { state_code: data.state || "MH" },
            });
            if (!stateObj) {
              stateObj = await prisma.state.create({
                data: {
                  state_code: data.state || "MH",
                  state_name: data.state || "Maharashtra",
                },
              });
            }
            if (stateObj) {
              business = await prisma.businessProfile.create({
                data: {
                  user_id: data.userId,
                  registration_number: `REG-${Date.now()}`,
                  trade_name: data.businessName || "Default Business",
                  entity_type: "USER",
                  geo_address: data.address || "Unknown Address",
                  state_id: stateObj.state_id,
                },
              });
            }
          }

          if (business) {
            // 2. Ensure InstrumentCategory exists
            let category = await prisma.instrumentCategory.findFirst({
              where: { category_name: data.instrumentSubCategory || "Default" },
            });
            if (!category) {
              category = await prisma.instrumentCategory.create({
                data: {
                  category_code: `CAT_${Date.now()}`,
                  category_name:
                    data.instrumentSubCategory || "Default Category",
                  accuracy_class: "CLASS_II",
                  oiml_standard_ref: "OIML-R76",
                  verification_cycle_months: 12,
                },
              });
            }

            // 3. Ensure MeasuringInstrument exists
            let instrument = await prisma.measuringInstrument.findFirst({
              where: {
                serial_number: data.instrumentSerialNumber,
                business_id: business.business_id,
              },
            });

            const mapAccuracyClass = (
              ac: string,
            ): "CLASS_I" | "CLASS_II" | "CLASS_III" | "CLASS_IIII" => {
              if (!ac) return "CLASS_II";
              const upper = ac.toUpperCase();
              if (upper.includes("CLASS I") && !upper.includes("II"))
                return "CLASS_I";
              if (upper.includes("CLASS II") && !upper.includes("III"))
                return "CLASS_II";
              if (upper.includes("CLASS III") && !upper.includes("IIII"))
                return "CLASS_III";
              if (upper.includes("CLASS IIII") || upper.includes("CLASS IV"))
                return "CLASS_IIII";
              return "CLASS_II";
            };

            if (!instrument) {
              instrument = await prisma.measuringInstrument.create({
                data: {
                  serial_number: data.instrumentSerialNumber,
                  model_no: data.modelNo || "Unknown Model",
                  manufacturer_name:
                    data.manufacturerName || "Unknown Manufacturer",
                  accuracy_class: mapAccuracyClass(data.accuracyClass),
                  metric: data.metric || "N/A",
                  address: data.address || business.geo_address,
                  pincode: Number(data.pincode) || 111111,
                  state: data.state || "N/A",
                  lat: Number(data.lat) || 0,
                  long: Number(data.long) || 0,
                  status: "PENDING",
                  business_id: business.business_id,
                  category_id: category.category_id,
                },
              });
            }

            // 4. Ensure VerificationApp exists
            let application = await prisma.verificationApp.findFirst({
              where: {
                instrument_id: instrument.instrument_id,
                workflow_status: { not: "CERTIFIED" },
              },
            });

            if (!application) {
              application = await prisma.verificationApp.create({
                data: {
                  application_no: data.applicationId || `APP-${Date.now()}`,
                  app_type: "INITIAL",
                  workflow_status: "SUBMITTED",
                  instrument_id: instrument.instrument_id,
                  business_id: business.business_id,
                },
              });
              console.log(
                `Successfully created VerificationApp ${application.app_id} for instrument ${instrument.serial_number}`,
              );
            }
          } else {
            console.error("Failed to create or find business profile");
            socket.emit("error", {
              message: "Failed to create or find business profile",
            });
          }
        } else {
          console.error(
            "Missing userId or instrumentSerialNumber in data payload",
          );
          socket.emit("error", {
            message: "Missing userId or instrumentSerialNumber",
          });
        }
      } catch (err) {
        console.error("Error creating verification relational records:", err);
      }
    });

    socket.on("disconnect", (reason) => {
      console.log(reason);
    });

    socket.on("inspection_approved", async (data) => {
      console.log("Tanishq ne approve kar diya hai! Payload:", data);

      // Anti-replay attack check (300 seconds threshold)
      const nowMs = Date.now();
      const payloadMs = data.timeStamp ? data.timeStamp / 1000 : nowMs; // convert microseconds to milliseconds

      if (Math.abs(nowMs - payloadMs) > 300000) {
        console.error("Replay attack detected: Timestamp expired", {
          nowMs,
          payloadMs,
        });
        return socket.emit("error", {
          message: "Replay attack detected: Timestamp expired",
        });
      }

      const { prisma } = await import("./lib/prisma");

      // Verify LMO is registered based on payload
      let inspectorId = data.inspectorId;
      let lmo = null;

      if (inspectorId) {
        lmo = await prisma.user.findFirst({
          where: { user_id: inspectorId, registrationRole: "INSPECTOR" },
        });
      }

      if (!lmo) {
        console.warn(
          "Unauthorized attempt: Missing or Invalid inspectorId. Using Fallback LMO for development.",
        );
        lmo = await prisma.user.findFirst({ where: { registrationRole: "INSPECTOR" } });
        if (!lmo) {
          lmo = await prisma.user.create({
            data: {
              name: "System Fallback LMO",
              fullName: "System Fallback LMO",
              email: `lmo_fallback_${Date.now()}@emaap.gov.in`,
              mobile: `${Date.now()}`.substring(0, 10),
              registrationRole: "INSPECTOR",
              jurisdiction_district: "Any",
              jurisdiction_state: "Any",
              passwordHash: "dummy",
              isActive: true,
              emailVerified: true,
              mobileVerified: true,
            },
          });
        }
        inspectorId = lmo.user_id;
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
          },
        });

        // --- RELATIONAL DATABASE SYNC FOR DASHBOARDS ---
        const instrument = await prisma.measuringInstrument.findFirst({
          where: { serial_number: finalCertPayload.instrumentSerialNumber },
        });

        if (instrument) {
          const application = await prisma.verificationApp.findFirst({
            where: {
              instrument_id: instrument.instrument_id,
              workflow_status: { not: "CERTIFIED" },
            },
            orderBy: { submission_timestamp: "desc" },
          });

          if (application) {
            const isRejected = finalCertPayload.status === "FAILED_CHECKLIST";
            const statusVerdict = isRejected ? "REJECTED" : "VERIFIED";

            await prisma.$transaction(async (tx) => {
              // 1. Update Instrument
              await tx.measuringInstrument.update({
                where: { instrument_id: instrument.instrument_id },
                data: { status: statusVerdict },
              });

              // 2. Update Application
              await tx.verificationApp.update({
                where: { app_id: application.app_id },
                data: {
                  workflow_status: isRejected ? "REJECTED" : "CERTIFIED",
                },
              });

              // 3. Create Inspection Record
              const inspection = await tx.inspectionRecord.create({
                data: {
                  time_taken_minutes: 15,
                  inspection_mode: "FIELD_OFFLINE",
                  test_verdict: isRejected ? "FAIL" : "PASS",
                  geo_latitude: finalCertPayload.lat,
                  geo_longitude: finalCertPayload.long,
                  inspector_id: inspectorId,
                  app_id: application.app_id,
                },
              });

              // 4. Create Digital Certificate for the Dashboard (including rejections)
              await tx.digitalCertificate.create({
                data: {
                  certificate_no: finalCertPayload.certificateId,
                  stamping_quarter_code: "Q3",
                  issue_date: new Date(finalCertPayload.issueDate),
                  expiry_date: new Date(
                    new Date(finalCertPayload.issueDate).setFullYear(
                      new Date(finalCertPayload.issueDate).getFullYear() + 1,
                    ),
                  ),
                  sha256_hash: finalCertPayload.hash,
                  dynamic_qr_url: `http://localhost:5173/verify/${finalCertPayload.certificateId}?sig=${encodeURIComponent(finalCertPayload.verificationSignature)}`,
                  inspection_id: inspection.inspection_id,
                  instrument_id: instrument.instrument_id,
                  rejection_reason: isRejected
                    ? "Failed Checklist (Warning)"
                    : null,
                },
              });

              // 5. Ensure PaymentReceipt is SUCCESS
              const receipt = await tx.paymentReceipt.findFirst({
                where: { app_id: application.app_id },
              });
              if (receipt) {
                await tx.paymentReceipt.update({
                  where: { receipt_id: receipt.receipt_id },
                  data: { payment_status: "SUCCESS" },
                });
              } else {
                await tx.paymentReceipt.create({
                  data: {
                    receipt_no: `REC-${Date.now()}`,
                    transaction_id: `TXN-${crypto.randomUUID()}`,
                    transaction_date: new Date(),
                    payment_method: "UPI",
                    statutory_fee: 500,
                    carriage_charges: 0,
                    adjusting_charges: 0,
                    total_amount: 500,
                    govt_share: 250,
                    gatc_share: 250,
                    payment_status: "SUCCESS",
                    app_id: application.app_id,
                  },
                });
              }
            });
            console.log("Successfully synced inspection to relational tables!");
          } else {
            console.error(
              `Relational Sync Skipped: No active VerificationApp found for instrument ${instrument.instrument_id}`,
            );
          }
        } else {
          console.error(
            `Relational Sync Skipped: MeasuringInstrument with serial number ${finalCertPayload.instrumentSerialNumber} not found in DB.`,
          );
        }
        // --- END SYNC ---

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
      return res.status(403).json({
        success: false,
        error: "Invalid or missing certificate signature.",
      });
    }

    console.log("Accepted certificate data: ", latestCertificate);
    res.json({ success: true, certificate: latestCertificate });
  });

  app.get("/api/certificates", async (_req, res) => {
    try {
      const { prisma } = await import("./lib/prisma");
      const certificatesList = await prisma.generatedCertificate.findMany({
        orderBy: { issueDate: "desc" },
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
        return res
          .status(403)
          .json({ error: "Cannot download rejected certificate." });
      }

      const { PDFDocument, rgb, StandardFonts } = await import("pdf-lib");
      const pdfDoc = await PDFDocument.create();
      let page = pdfDoc.addPage([595.28, 841.89]); // A4 size
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      const { width, height } = page.getSize();

      // Official Colors
      const navyBlue = rgb(11 / 255, 61 / 255, 145 / 255);
      const orange = rgb(249 / 255, 115 / 255, 22 / 255);
      const saffron = rgb(255 / 255, 153 / 255, 51 / 255);
      const white = rgb(1, 1, 1);
      const indiaGreen = rgb(19 / 255, 136 / 255, 8 / 255);
      const gray = rgb(0.5, 0.5, 0.5);
      const lightGray = rgb(0.97, 0.97, 0.97);
      const borderGray = rgb(0.9, 0.9, 0.9);
      const darkGray = rgb(0.15, 0.15, 0.15);

      // 1. Tricolor Banner at top
      const bannerHeight = 6;
      page.drawRectangle({
        x: 0,
        y: height - bannerHeight,
        width,
        height: bannerHeight,
        color: saffron,
      });
      page.drawRectangle({
        x: 0,
        y: height - bannerHeight * 2,
        width,
        height: bannerHeight,
        color: white,
      });
      page.drawRectangle({
        x: 0,
        y: height - bannerHeight * 3,
        width,
        height: bannerHeight,
        color: indiaGreen,
      });

      // 2. Govt Header
      page.drawText("GOVERNMENT OF INDIA", {
        x: width / 2 - 60,
        y: height - 50,
        size: 10,
        font: boldFont,
        color: gray,
      });
      page.drawText("DEPARTMENT OF CONSUMER AFFAIRS", {
        x: width / 2 - 105,
        y: height - 65,
        size: 10,
        font: boldFont,
        color: gray,
      });

      // 3. Title Section
      page.drawText("VERIFIED LEGAL METROLOGY", {
        x: 50,
        y: height - 120,
        size: 22,
        font: boldFont,
        color: navyBlue,
      });
      page.drawText("OFFICIAL VERIFICATION CERTIFICATE", {
        x: 50,
        y: height - 140,
        size: 11,
        font: boldFont,
        color: orange,
      });

      // Divider line
      page.drawLine({
        start: { x: 50, y: height - 155 },
        end: { x: width - 50, y: height - 155 },
        thickness: 1,
        color: borderGray,
      });

      // 4. Details Box
      const boxY = height - 280;
      page.drawRectangle({
        x: 50,
        y: boxY,
        width: width - 100,
        height: 110,
        color: lightGray,
        borderColor: borderGray,
        borderWidth: 1,
      });

      page.drawText("Instrument Category", {
        x: 70,
        y: boxY + 85,
        size: 9,
        font: font,
        color: gray,
      });
      page.drawText(cert.instrumentCategory || "N/A", {
        x: 70,
        y: boxY + 70,
        size: 14,
        font: boldFont,
        color: darkGray,
      });

      page.drawText("Serial Number", {
        x: 300,
        y: boxY + 85,
        size: 9,
        font: font,
        color: gray,
      });
      page.drawText(cert.instrumentSerialNumber, {
        x: 300,
        y: boxY + 70,
        size: 14,
        font: boldFont,
        color: darkGray,
      });

      page.drawText("Certificate ID", {
        x: 70,
        y: boxY + 35,
        size: 9,
        font: font,
        color: gray,
      });
      page.drawText(cert.certificateId, {
        x: 70,
        y: boxY + 20,
        size: 11,
        font: font,
        color: darkGray,
      });

      page.drawText("Issue Date", {
        x: 300,
        y: boxY + 35,
        size: 9,
        font: font,
        color: gray,
      });
      page.drawText(new Date(cert.issueDate).toLocaleString(), {
        x: 300,
        y: boxY + 20,
        size: 11,
        font: boldFont,
        color: darkGray,
      });

      // 5. Cryptographic Hashes Section
      let currentY = boxY - 30;
      page.drawText("CRYPTOGRAPHIC HASH", {
        x: 50,
        y: currentY,
        size: 9,
        font: boldFont,
        color: gray,
      });
      currentY -= 25;
      page.drawRectangle({
        x: 50,
        y: currentY,
        width: width - 100,
        height: 20,
        color: white,
        borderColor: borderGray,
        borderWidth: 1,
      });
      page.drawText(cert.hash, {
        x: 60,
        y: currentY + 6,
        size: 9,
        font: font,
        color: navyBlue,
      });

      if (cert.tokenHash) {
        currentY -= 30;
        page.drawText("DIGITAL SIGNATURE (TOKEN HASH)", {
          x: 50,
          y: currentY,
          size: 9,
          font: boldFont,
          color: gray,
        });
        currentY -= 25;
        page.drawRectangle({
          x: 50,
          y: currentY,
          width: width - 100,
          height: 20,
          color: white,
          borderColor: borderGray,
          borderWidth: 1,
        });
        page.drawText(cert.tokenHash, {
          x: 60,
          y: currentY + 6,
          size: 9,
          font: font,
          color: navyBlue,
        });
      }

      // 6. Seal Image
      currentY -= 40;
      page.drawText("Live Physical Seal Evidence:", {
        x: 50,
        y: currentY,
        size: 14,
        font: boldFont,
        color: navyBlue,
      });

      if (cert.sealImageUrls && cert.sealImageUrls.length > 0) {
        for (let i = 0; i < cert.sealImageUrls.length; i++) {
          let imageUrl = cert.sealImageUrls[i];
          if (imageUrl.startsWith("http://")) {
            imageUrl = imageUrl.replace("http://", "https://");
          }
          try {
            const imgResponse = await fetch(imageUrl);
            const imgBuffer = await imgResponse.arrayBuffer();

            let img;
            if (imageUrl.toLowerCase().endsWith(".png")) {
              img = await pdfDoc.embedPng(imgBuffer);
            } else {
              img = await pdfDoc.embedJpg(imgBuffer);
            }

            // Scale image to fit nicely
            const maxImgWidth = width - 100;
            const maxImgHeight = 250;
            let imgDims = img.scale(1);

            if (imgDims.width > maxImgWidth || imgDims.height > maxImgHeight) {
              const scaleFactor = Math.min(
                maxImgWidth / imgDims.width,
                maxImgHeight / imgDims.height,
              );
              imgDims = img.scale(scaleFactor);
            }

            // Check if we have enough space for the image, if not add a new page
            if (currentY - (imgDims.height + 15) < 50) {
              page = pdfDoc.addPage([595.28, 841.89]);
              currentY = height - 50;

              // Add a small header on the new page
              page.drawText("Live Physical Seal Evidence (Continued):", {
                x: 50,
                y: currentY,
                size: 14,
                font: boldFont,
                color: navyBlue,
              });
              currentY -= 20;
            }

            currentY -= imgDims.height + 15;

            // Image border
            page.drawRectangle({
              x: 48,
              y: currentY - 2,
              width: imgDims.width + 4,
              height: imgDims.height + 4,
              borderColor: orange,
              borderWidth: 2,
            });

            page.drawImage(img, {
              x: 50,
              y: currentY,
              width: imgDims.width,
              height: imgDims.height,
            });

            currentY -= 20; // Extra spacing between multiple images
          } catch (imgError) {
            console.error(`Failed to embed image ${i} in PDF:`, imgError);
            if (currentY - 30 < 50) {
              page = pdfDoc.addPage([595.28, 841.89]);
              currentY = height - 50;
            }
            currentY -= 30;
            page.drawText(
              `[Seal Image ${i + 1} could not be loaded into PDF]`,
              { x: 50, y: currentY, size: 10, font, color: orange },
            );
          }
        }
      }

      // Footer
      page.drawRectangle({ x: 0, y: 0, width, height: 40, color: navyBlue });
      page.drawText(
        "This is a cryptographically secured verification record. Any modification invalidates this certificate.",
        {
          x: 50,
          y: 15,
          size: 9,
          font: font,
          color: white,
        },
      );

      const pdfBytes = await pdfDoc.save();

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="Certificate-${cert.certificateId.substring(0, 8)}.pdf"`,
      );
      res.send(Buffer.from(pdfBytes));
    } catch (error) {
      console.error("Failed to generate PDF:", error);
      res.status(500).json({ success: false, error: "Failed to generate PDF" });
    }
  });

  return { app, httpServer, io };
}
