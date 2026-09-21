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

import { correlationIdMiddleware } from "./middleware/correlation-id";

import {
  createCertificateSignature,
  verifyCertificateSignature,
} from "./services/qr-payload.service";

/**
 * Normalize serial numbers everywhere so that:
 * "v-123", "V-123", " V-123 "
 * all become:
 * "V-123"
 */
const normalizeSerialNumber = (value: unknown): string => {
  return String(value ?? "")
    .trim()
    .toUpperCase();
};

/**
 * Map frontend accuracy class values to Prisma enum values.
 */
const mapAccuracyClass = (
  ac: unknown,
): "CLASS_I" | "CLASS_II" | "CLASS_III" | "CLASS_IIII" => {
  if (!ac) return "CLASS_II";

  const upper = String(ac).trim().toUpperCase();

  if (upper.includes("CLASS IIII") || upper.includes("CLASS IV")) {
    return "CLASS_IIII";
  }

  if (upper.includes("CLASS III")) {
    return "CLASS_III";
  }

  if (upper.includes("CLASS II")) {
    return "CLASS_II";
  }

  if (upper.includes("CLASS I")) {
    return "CLASS_I";
  }

  return "CLASS_II";
};

/**
 * Get frontend URL used inside generated QR URLs.
 *
 * FRONTEND_URL can contain comma-separated origins, so use the first one
 * as the public/default frontend URL.
 */
const getFrontendBaseUrl = (): string => {
  const configuredUrl = process.env.FRONTEND_URL?.split(",")
    .map((origin) => origin.trim())
    .find(Boolean);

  return (
    configuredUrl ||
    process.env.VITE_FRONTEND_URL ||
    "http://localhost:5173"
  ).replace(/\/+$/, "");
};

/**
 * Extract the application identifier from different possible payload
 * naming conventions used by frontend/mobile code.
 */
const getApplicationIdentifier = (data: any): string => {
  return String(
    data?.applicationId ??
      data?.applicationNo ??
      data?.application_id ??
      data?.application_no ??
      "",
  ).trim();
};

/**
 * Resolve timestamp safely.
 *
 * Supports:
 * - milliseconds
 * - microseconds
 * - missing timestamp
 */
const resolvePayloadTimestampMs = (value: unknown): number => {
  const timestamp = Number(value);

  if (!Number.isFinite(timestamp) || timestamp <= 0) {
    return Date.now();
  }

  // Microseconds are usually around 1e15.
  // Milliseconds are usually around 1e12.
  if (timestamp > 1e12) {
    return timestamp / 1000;
  }

  return timestamp;
};

/**
 * Briefly wait for the VerificationApp to appear.
 *
 * This protects against the case where:
 *
 * socket.emit("data")
 *      ↓
 * DB write starts
 *      ↓
 * socket.emit("inspection_approved")
 *      ↓
 * approval query runs before DB write finishes
 *
 * The frontend should still wait for "verification_persisted",
 * but this server-side retry makes the flow more resilient.
 */
const findApplicationWithRetry = async (
  prisma: any,
  applicationIdentifier: string,
  serialNumber: string,
  retries = 5,
  delayMs = 200,
) => {
  for (let attempt = 0; attempt <= retries; attempt++) {
    let application = null;

    if (applicationIdentifier) {
      application = await prisma.verificationApp.findFirst({
        where: {
          application_no: applicationIdentifier,
        },
        include: {
          instrument: true,
        },
        orderBy: {
          submission_timestamp: "desc",
        },
      });
    }

    if (!application && serialNumber) {
      application = await prisma.verificationApp.findFirst({
        where: {
          instrument: {
            serial_number: serialNumber,
          },
          workflow_status: {
            not: "CERTIFIED",
          },
        },
        include: {
          instrument: true,
        },
        orderBy: {
          submission_timestamp: "desc",
        },
      });
    }

    if (application) {
      return application;
    }

    if (attempt < retries) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  return null;
};

export function createServer() {
  const app = express();

  const httpServer = createHttpServer(app);

  /**
   * CORS
   */
  const allowedOrigins = process.env.FRONTEND_URL?.split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  const corsOrigin = function (
    origin: string | undefined,
    callback: (err: Error | null, allow?: boolean) => void,
  ) {
    if (!origin) {
      return callback(null, true);
    }

    // Allow localhost and local network IPs during development/mobile testing.
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

  /**
   * Socket.IO
   */
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: corsOrigin,
      methods: ["GET", "POST"],
    },
  });

  app.set("io", io);

  /**
   * Middleware
   */
  app.use(correlationIdMiddleware);

  app.use(cors({ origin: corsOrigin }));

  app.use(express.json());

  app.use(express.urlencoded({ extended: true }));

  /**
   * API Routes
   */
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

  /**
   * Socket connections
   */
  io.on("connection", (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    /**
     * Basic socket test event
     */
    socket.on("msg", (data) => {
      console.log(`Received data: ${JSON.stringify(data)}`);

      socket.emit("reply", "Whatup");
    });

    /**
     * Verification submission
     *
     * Expected payload should contain at minimum:
     * {
     *   userId,
     *   instrumentSerialNumber,
     *   applicationId
     * }
     *
     * This creates the relational chain:
     *
     * User
     *   ↓
     * BusinessProfile
     *   ↓
     * InstrumentCategory
     *   ↓
     * MeasuringInstrument
     *   ↓
     * VerificationApp
     */
    socket.on("data", async (data) => {
      console.log("[DATA] Verification submission received:", {
        socketId: socket.id,
        userId: data?.userId,
        applicationId: getApplicationIdentifier(data),
        instrumentSerialNumber: JSON.stringify(data?.instrumentSerialNumber),
      });

      // Preserve existing broadcast behavior.
      socket.broadcast.emit("message", data);

      try {
        const { prisma } = await import("./lib/prisma");

        const userId = String(data?.userId ?? "").trim();

        const serialNumber = normalizeSerialNumber(
          data?.instrumentSerialNumber,
        );

        const applicationIdentifier = getApplicationIdentifier(data);

        /**
         * Required fields
         */
        if (!userId || !serialNumber) {
          console.error("[DATA] Missing required fields:", {
            userId,
            serialNumber,
            rawInstrumentSerialNumber: data?.instrumentSerialNumber,
          });

          return socket.emit("verification_persistence_failed", {
            success: false,
            message:
              "Missing userId or instrumentSerialNumber in data payload.",
          });
        }

        /**
         * 1. Ensure BusinessProfile exists
         */
        console.log("[DATA] Looking for BusinessProfile:", {
          userId,
        });

        let business = await prisma.businessProfile.findUnique({
          where: {
            user_id: userId,
          },
        });

        if (!business) {
          console.log("[DATA] BusinessProfile not found. Creating one...");

          const stateCode = String(data?.state ?? "MH")
            .trim()
            .toUpperCase();

          let stateObj = await prisma.state.findFirst({
            where: {
              state_code: stateCode,
            },
          });

          if (!stateObj) {
            console.log("[DATA] State not found. Creating:", stateCode);

            stateObj = await prisma.state.create({
              data: {
                state_code: stateCode,
                state_name: String(data?.state ?? "Maharashtra").trim(),
              },
            });
          }

          business = await prisma.businessProfile.create({
            data: {
              user_id: userId,
              registration_number: `REG-${Date.now()}`,
              trade_name: data?.businessName || "Default Business",
              entity_type: "USER",
              geo_address: data?.address || "Unknown Address",
              state_id: stateObj.state_id,
            },
          });

          console.log("[DATA] BusinessProfile created:", {
            businessId: business.business_id,
          });
        }

        /**
         * 2. Ensure InstrumentCategory exists
         */
        console.log("[DATA] Looking for InstrumentCategory:", {
          categoryName: data?.instrumentSubCategory || "Default Category",
        });

        let category = await prisma.instrumentCategory.findFirst({
          where: {
            category_name: data?.instrumentSubCategory || "Default Category",
          },
        });

        if (!category) {
          category = await prisma.instrumentCategory.create({
            data: {
              category_code: `CAT_${Date.now()}`,
              category_name: data?.instrumentSubCategory || "Default Category",
              accuracy_class: mapAccuracyClass(data?.accuracyClass),
              oiml_standard_ref: "OIML-R76",
              verification_cycle_months: 12,
            },
          });

          console.log("[DATA] InstrumentCategory created:", {
            categoryId: category.category_id,
          });
        }

        /**
         * 3. Ensure MeasuringInstrument exists
         */
        console.log("[DATA] Looking for MeasuringInstrument:", {
          businessId: business.business_id,
          serialNumber,
        });

        let instrument = await prisma.measuringInstrument.findFirst({
          where: {
            serial_number: serialNumber,
            business_id: business.business_id,
          },
        });

        if (!instrument) {
          console.log("[DATA] MeasuringInstrument not found. Creating...");

          instrument = await prisma.measuringInstrument.create({
            data: {
              serial_number: serialNumber,

              model_no: data?.modelNo || "Unknown Model",

              manufacturer_name:
                data?.manufacturerName || "Unknown Manufacturer",

              accuracy_class: mapAccuracyClass(data?.accuracyClass),

              metric: data?.metric || "N/A",

              address:
                data?.address || business.geo_address || "Unknown Address",

              pincode: Number(data?.pincode) || 111111,

              state: data?.state || "N/A",

              lat: Number(data?.lat) || 0,

              long: Number(data?.long) || 0,

              status: "PENDING",

              business_id: business.business_id,

              category_id: category.category_id,
            },
          });

          console.log("[DATA] MeasuringInstrument created:", {
            instrumentId: instrument.instrument_id,
            serialNumber: instrument.serial_number,
          });
        } else {
          console.log("[DATA] MeasuringInstrument already exists:", {
            instrumentId: instrument.instrument_id,
            serialNumber: instrument.serial_number,
          });
        }

        /**
         * 4. Ensure VerificationApp exists
         *
         * Prefer applicationId when supplied.
         * Otherwise use instrument + non-certified workflow.
         */
        console.log("[DATA] Looking for VerificationApp:", {
          applicationIdentifier,
          instrumentId: instrument.instrument_id,
        });

        let application = null;

        if (applicationIdentifier) {
          application = await prisma.verificationApp.findFirst({
            where: {
              application_no: applicationIdentifier,
            },
            orderBy: {
              submission_timestamp: "desc",
            },
          });
        }

        if (!application) {
          application = await prisma.verificationApp.findFirst({
            where: {
              instrument_id: instrument.instrument_id,

              workflow_status: {
                not: "CERTIFIED",
              },
            },
            orderBy: {
              submission_timestamp: "desc",
            },
          });
        }

        if (!application) {
          application = await prisma.verificationApp.create({
            data: {
              application_no: applicationIdentifier || `APP-${Date.now()}`,

              app_type: "INITIAL",

              workflow_status: "SUBMITTED",

              instrument_id: instrument.instrument_id,

              business_id: business.business_id,
            },
          });

          console.log("[DATA] VerificationApp created:", {
            appId: application.app_id,
            applicationNo: application.application_no,
            instrumentId: instrument.instrument_id,
          });
        } else {
          console.log("[DATA] VerificationApp already exists:", {
            appId: application.app_id,
            applicationNo: application.application_no,
            workflowStatus: application.workflow_status,
          });
        }

        /**
         * IMPORTANT:
         * Tell the frontend/mobile side that relational persistence
         * has completed.
         *
         * The inspection approval flow should ideally wait for this.
         */
        socket.emit("verification_persisted", {
          success: true,

          applicationId: application.app_id,

          applicationNo: application.application_no,

          instrumentId: instrument.instrument_id,

          serialNumber: instrument.serial_number,

          businessId: business.business_id,
        });

        console.log("[DATA] Relational persistence completed successfully.");
      } catch (err) {
        console.error(
          "[DATA] Error creating verification relational records:",
          err,
        );

        socket.emit("verification_persistence_failed", {
          success: false,
          message:
            err instanceof Error
              ? err.message
              : "Failed to create verification records.",
        });
      }
    });

    /**
     * Disconnect
     */
    socket.on("disconnect", (reason) => {
      console.log(`Socket disconnected: ${socket.id}`, reason);
    });

    /**
     * Inspection approval
     */
    socket.on("inspection_approved", async (data) => {
      console.log("[APPROVAL] Inspection approved payload:", data);

      try {
        const { prisma } = await import("./lib/prisma");

        /**
         * ---------------------------------------------------------
         * 1. Anti-replay protection
         * ---------------------------------------------------------
         */
        const nowMs = Date.now();

        const payloadMs =
          data?.timeStamp != null
            ? resolvePayloadTimestampMs(data.timeStamp)
            : nowMs;

        if (Math.abs(nowMs - payloadMs) > 300000) {
          console.error("[APPROVAL] Replay attack detected:", {
            nowMs,
            payloadMs,
          });

          return socket.emit("approval_failed", {
            success: false,
            message: "Replay attack detected: Timestamp expired.",
          });
        }

        /**
         * ---------------------------------------------------------
         * 2. Normalize approval payload
         * ---------------------------------------------------------
         */
        const serialNumber = normalizeSerialNumber(
          data?.instrumentSerialNumber,
        );

        const applicationIdentifier = getApplicationIdentifier(data);

        /**
         * Support both:
         *
         * inspectorId
         * inspector_id
         */
        let inspectorId = String(
          data?.inspectorId ?? data?.inspector_id ?? "",
        ).trim();

        /**
         * ---------------------------------------------------------
         * 3. Resolve inspector / LMO
         * ---------------------------------------------------------
         */
        let lmo = null;

        if (inspectorId) {
          lmo = await prisma.user.findFirst({
            where: {
              user_id: inspectorId,
              registrationRole: "INSPECTOR",
            },
          });
        }

        /**
         * Development fallback.
         *
         * Your current system already uses this behavior, so it is
         * preserved here rather than silently changing the auth model.
         */
        if (!lmo) {
          console.warn(
            "[APPROVAL] Missing or invalid inspectorId. " +
              "Using fallback inspector for development.",
          );

          lmo = await prisma.user.findFirst({
            where: {
              registrationRole: "INSPECTOR",
            },
          });

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

        /**
         * ---------------------------------------------------------
         * 4. Find the application FIRST
         * ---------------------------------------------------------
         *
         * This is the critical fix.
         *
         * Before:
         *   approval -> serial number -> instrument
         *
         * Now:
         *   approval -> application -> instrument
         */
        if (!applicationIdentifier && !serialNumber) {
          console.error(
            "[APPROVAL] Missing application identifier and serial number.",
          );

          return socket.emit("approval_failed", {
            success: false,
            message:
              "Missing application identifier or instrument serial number.",
          });
        }

        console.log("[APPROVAL] Searching for VerificationApp:", {
          applicationIdentifier,
          serialNumber,
        });

        const application = await findApplicationWithRetry(
          prisma,
          applicationIdentifier,
          serialNumber,
        );

        if (!application) {
          console.error("[APPROVAL] VerificationApp not found after retry.", {
            applicationIdentifier,
            serialNumber,
          });

          return socket.emit("approval_failed", {
            success: false,
            message:
              "Verification application was not persisted before approval.",
          });
        }

        const instrument = application.instrument;

        if (!instrument) {
          console.error(
            "[APPROVAL] VerificationApp has no related instrument:",
            {
              appId: application.app_id,
              applicationNo: application.application_no,
            },
          );

          return socket.emit("approval_failed", {
            success: false,
            message: "Verification application has no linked instrument.",
          });
        }

        /**
         * Protect against duplicate approval events.
         */
        if (
          application.workflow_status === "CERTIFIED" ||
          application.workflow_status === "REJECTED"
        ) {
          console.warn("[APPROVAL] Application has already been completed:", {
            applicationNo: application.application_no,
            workflowStatus: application.workflow_status,
          });

          return socket.emit("approval_failed", {
            success: false,
            message:
              "This verification application has already been processed.",
          });
        }

        /**
         * Ensure the payload serial and DB serial agree.
         */
        if (
          serialNumber &&
          normalizeSerialNumber(instrument.serial_number) !== serialNumber
        ) {
          console.error("[APPROVAL] Serial number mismatch:", {
            payloadSerial: serialNumber,
            databaseSerial: instrument.serial_number,
          });

          return socket.emit("approval_failed", {
            success: false,
            message:
              "Instrument serial number does not match the verification application.",
          });
        }

        console.log("[APPROVAL] VerificationApp resolved successfully:", {
          appId: application.app_id,
          applicationNo: application.application_no,
          instrumentId: instrument.instrument_id,
          serialNumber: instrument.serial_number,
        });

        /**
         * ---------------------------------------------------------
         * 5. Generate certificate payload
         * ---------------------------------------------------------
         */
        const issueTimestamp = new Date().toISOString();

        const tokenHash = data?.token_hash ?? data?.tokenHash ?? "";

        const lat = Number(data?.lat) || 0;

        const long = Number(data?.long) || 0;

        const instrumentCategory =
          data?.instrumentCategory ?? data?.instrument_category ?? null;

        const sealImageUrls = Array.isArray(data?.sealImageUrls)
          ? data.sealImageUrls
          : [];

        const rawDataToHash =
          `${instrument.serial_number}|` +
          `${lat},${long}|` +
          `${issueTimestamp}|` +
          `LMO-MP-1048|` +
          `${tokenHash}`;

        const realHash = crypto
          .createHash("sha256")
          .update(rawDataToHash)
          .digest("hex");

        console.log("[APPROVAL] Generated cryptographic hash:", realHash);

        const certificateId = crypto.randomUUID();

        const verificationSignature = createCertificateSignature(
          certificateId,
          realHash,
        );

        const status = data?.status || "APPROVED_CHECKLIST";

        const isRejected = status === "FAILED_CHECKLIST";

        const workflowStatus = isRejected ? "REJECTED" : "CERTIFIED";

        const instrumentStatus = isRejected ? "REJECTED" : "VERIFIED";

        const frontendBaseUrl = getFrontendBaseUrl();

        const dynamicQrUrl =
          `${frontendBaseUrl}/verify/` +
          `${certificateId}?sig=` +
          `${encodeURIComponent(verificationSignature)}`;

        const expiryDate = new Date(issueTimestamp);

        expiryDate.setFullYear(expiryDate.getFullYear() + 1);

        /**
         * The object is emitted to frontend after the transaction commits.
         */
        const finalCertPayload = {
          ...data,

          applicationId: applicationIdentifier || application.application_no,

          applicationNo: application.application_no,

          certificateId,

          issueDate: issueTimestamp,

          instrumentSerialNumber: instrument.serial_number,

          instrumentCategory,

          lat,

          long,

          sealImageUrls,

          hash: realHash,

          verificationSignature,

          status,

          inspectorId,

          token_hash: tokenHash,
        };

        /**
         * ---------------------------------------------------------
         * 6. Atomic relational sync
         * ---------------------------------------------------------
         *
         * Everything needed by dashboards is committed together:
         *
         * GeneratedCertificate
         * MeasuringInstrument
         * VerificationApp
         * InspectionRecord
         * DigitalCertificate
         * PaymentReceipt
         */
        await prisma.$transaction(async (tx) => {
          /**
           * 6.1 GeneratedCertificate
           */
          await tx.generatedCertificate.create({
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

              status: finalCertPayload.status,

              tokenHash: finalCertPayload.token_hash || null,
            },
          });

          /**
           * 6.2 Update instrument
           */
          await tx.measuringInstrument.update({
            where: {
              instrument_id: instrument.instrument_id,
            },

            data: {
              status: instrumentStatus,
            },
          });

          /**
           * 6.3 Update application
           */
          await tx.verificationApp.update({
            where: {
              app_id: application.app_id,
            },

            data: {
              workflow_status: workflowStatus,
            },
          });

          /**
           * 6.4 Create inspection record
           */
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

          /**
           * 6.5 Create dashboard DigitalCertificate
           */
          await tx.digitalCertificate.create({
            data: {
              certificate_no: finalCertPayload.certificateId,

              stamping_quarter_code: "Q3",

              issue_date: new Date(finalCertPayload.issueDate),

              expiry_date: expiryDate,

              sha256_hash: finalCertPayload.hash,

              dynamic_qr_url: dynamicQrUrl,

              inspection_id: inspection.inspection_id,

              instrument_id: instrument.instrument_id,

              rejection_reason: isRejected
                ? "Failed Checklist (Warning)"
                : null,
            },
          });

          /**
           * 6.6 Ensure payment is SUCCESS
           */
          const receipt = await tx.paymentReceipt.findFirst({
            where: {
              app_id: application.app_id,
            },
          });

          if (receipt) {
            await tx.paymentReceipt.update({
              where: {
                receipt_id: receipt.receipt_id,
              },

              data: {
                payment_status: "SUCCESS",
              },
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

        console.log(
          "[APPROVAL] Successfully synced inspection and certificate to relational tables:",
          {
            applicationNo: application.application_no,

            instrumentId: instrument.instrument_id,

            serialNumber: instrument.serial_number,

            certificateId: certificateId,

            dynamicQrUrl,
          },
        );

        /**
         * IMPORTANT:
         * Only tell clients that the certificate exists AFTER
         * the entire relational transaction has committed.
         */
        io.emit("certificate_generated", finalCertPayload);
      } catch (error) {
        console.error(
          "[APPROVAL] Failed to process inspection approval:",
          error,
        );

        socket.emit("approval_failed", {
          success: false,

          message:
            error instanceof Error
              ? error.message
              : "Failed to process inspection approval.",
        });
      }
    });
  });

  /**
   * Health check
   */
  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";

    res.json({
      message: ping,
    });
  });

  /**
   * QR / certificate verification
   */
  app.get("/api/verify/:certificateId", async (req, res) => {
    try {
      const { certificateId } = req.params;

      const { prisma } = await import("./lib/prisma");

      const latestCertificate = await prisma.generatedCertificate.findUnique({
        where: {
          certificateId,
        },
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

      console.log("Accepted certificate data:", latestCertificate);

      return res.json({
        success: true,
        certificate: latestCertificate,
      });
    } catch (error) {
      console.error("Failed to verify certificate:", error);

      return res.status(500).json({
        success: false,
        error: "Failed to verify certificate.",
      });
    }
  });

  /**
   * List standalone generated certificates
   */
  app.get("/api/certificates", async (_req, res) => {
    try {
      const { prisma } = await import("./lib/prisma");

      const certificatesList = await prisma.generatedCertificate.findMany({
        orderBy: {
          issueDate: "desc",
        },
      });

      return res.json(certificatesList);
    } catch (error) {
      console.error("Failed to list certificates:", error);

      return res.status(500).json({
        success: false,
        error: "Database error",
      });
    }
  });

  /**
   * Download certificate PDF
   */
  app.get("/api/certificates/:certificateId/download", async (req, res) => {
    try {
      const { certificateId } = req.params;

      const { prisma } = await import("./lib/prisma");

      const cert = await prisma.generatedCertificate.findUnique({
        where: {
          certificateId,
        },
      });

      if (!cert) {
        return res.status(404).json({
          error: "Certificate not found",
        });
      }

      if (cert.status === "FAILED_CHECKLIST") {
        return res.status(403).json({
          error: "Cannot download rejected certificate.",
        });
      }

      const { PDFDocument, rgb, StandardFonts } = await import("pdf-lib");

      const pdfDoc = await PDFDocument.create();

      let page = pdfDoc.addPage([595.28, 841.89]);

      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

      const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

      const { width, height } = page.getSize();

      /**
       * Official Colors
       */
      const navyBlue = rgb(11 / 255, 61 / 255, 145 / 255);

      const orange = rgb(249 / 255, 115 / 255, 22 / 255);

      const saffron = rgb(255 / 255, 153 / 255, 51 / 255);

      const white = rgb(1, 1, 1);

      const indiaGreen = rgb(19 / 255, 136 / 255, 8 / 255);

      const gray = rgb(0.5, 0.5, 0.5);

      const lightGray = rgb(0.97, 0.97, 0.97);

      const borderGray = rgb(0.9, 0.9, 0.9);

      const darkGray = rgb(0.15, 0.15, 0.15);

      /**
       * 1. Tricolor Banner
       */
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

      /**
       * 2. Government Header
       */
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

      /**
       * 3. Title Section
       */
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

      /**
       * Divider
       */
      page.drawLine({
        start: {
          x: 50,
          y: height - 155,
        },

        end: {
          x: width - 50,
          y: height - 155,
        },

        thickness: 1,

        color: borderGray,
      });

      /**
       * 4. Details Box
       */
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

      /**
       * 5. Cryptographic Hash
       */
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

      /**
       * Token hash / digital signature
       */
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

      /**
       * 6. Seal Image
       */
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

          /**
           * Preserve your existing HTTP → HTTPS behavior.
           */
          if (imageUrl.startsWith("http://")) {
            imageUrl = imageUrl.replace("http://", "https://");
          }

          try {
            const imgResponse = await fetch(imageUrl);

            if (!imgResponse.ok) {
              throw new Error(
                `HTTP ${imgResponse.status} while fetching seal image`,
              );
            }

            const imgBuffer = await imgResponse.arrayBuffer();

            let img: any;

            if (imageUrl.toLowerCase().includes(".png")) {
              img = await pdfDoc.embedPng(imgBuffer);
            } else {
              img = await pdfDoc.embedJpg(imgBuffer);
            }

            /**
             * Scale image to fit nicely.
             */
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

            /**
             * Add a new page if necessary.
             */
            if (currentY - (imgDims.height + 15) < 50) {
              page = pdfDoc.addPage([595.28, 841.89]);

              currentY = height - 50;

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

            /**
             * Image border.
             */
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

            currentY -= 20;
          } catch (imgError) {
            console.error(`Failed to embed image ${i} in PDF:`, imgError);

            if (currentY - 30 < 50) {
              page = pdfDoc.addPage([595.28, 841.89]);

              currentY = height - 50;
            }

            currentY -= 30;

            page.drawText(
              `[Seal Image ${i + 1} could not be loaded into PDF]`,
              {
                x: 50,

                y: currentY,

                size: 10,

                font,

                color: orange,
              },
            );
          }
        }
      }

      /**
       * Footer
       */
      page.drawRectangle({
        x: 0,

        y: 0,

        width,

        height: 40,

        color: navyBlue,
      });

      page.drawText(
        "This is a cryptographically secured verification record. Any modification invalidates this certificate.",
        {
          x: 50,

          y: 15,

          size: 9,

          font,

          color: white,
        },
      );

      /**
       * Save PDF
       */
      const pdfBytes = await pdfDoc.save();

      res.setHeader("Content-Type", "application/pdf");

      res.setHeader(
        "Content-Disposition",
        `attachment; filename="Certificate-${cert.certificateId.substring(
          0,
          8,
        )}.pdf"`,
      );

      return res.send(Buffer.from(pdfBytes));
    } catch (error) {
      console.error("Failed to generate PDF:", error);

      return res.status(500).json({
        success: false,
        error: "Failed to generate PDF",
      });
    }
  });

  return {
    app,
    httpServer,
    io,
  };
}
