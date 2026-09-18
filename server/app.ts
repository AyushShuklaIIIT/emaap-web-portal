import "dotenv/config";
import express from "express";
import crypto from "node:crypto";
import cors from "cors";
import { handleDemo } from "./demo";
import { createServer as createHttpServer } from "node:http";
import { Server as SocketIOServer } from "socket.io";

import { router as uploadRouter } from "./routes/app.routes";
import { router as dashboardRouter } from "./routes/dashboard.routes";
import { router as instrumentRouter } from "./routes/instrument.routes";
import { router as verificationRouter } from "./routes/verificationApp.routes";
import { router as paymentRouter } from "./routes/payment.routes";

import { prisma } from "./lib/prisma";

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
  app.use(cors({ origin: corsOrigin }));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use("/uploads", express.static("uploads"));
  app.use("/api", uploadRouter);

  app.use("/api/dashboard", dashboardRouter);
  app.use("/api/instrument", instrumentRouter);
  app.use("/api/verification", verificationRouter);
  app.use("/api/payment", paymentRouter);

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
      try {
        console.log("Inspection approved. Generating certificate...");

        const inspection = await prisma.inspectionRecord.findUnique({
          where: {
            inspection_id: data.inspectionId,
          },
          include: {
            application: {
              include: {
                instrument: {
                  include: {
                    category: true,
                  },
                },
              },
            },
          },
        });

        if (!inspection) {
          socket.emit("certificate_error", {
            message: "Inspection not found",
          });
          return;
        }

        if (inspection.test_verdict !== "PASS") {
          socket.emit("certificate_error", {
            message:
              "Certificate can only be generated for a passed inspection",
          });
          return;
        }

        const instrument = inspection.application.instrument;

        const existingCertificate = await prisma.digitalCertificate.findUnique({
          where: {
            inspection_id: inspection.inspection_id,
          },
        });

        if (existingCertificate) {
          socket.emit("certificate_error", {
            message: "Certificate already exists for this inspection",
          });
          return;
        }

        const issueTimestamp = new Date();

        const rawDataToHash =
          `${instrument.serial_number}|` +
          `${instrument.lat},${instrument.long}|` +
          `${issueTimestamp.toISOString()}|` +
          `LMO-MP-1048|` +
          `${data.sealImageBase64}`;

        const realHash = crypto
          .createHash("sha256")
          .update(rawDataToHash)
          .digest("hex");

        const certificateId = `CERT-${crypto.randomUUID()}`;

        const dynamicQrUrl = `${process.env.BACKEND_URL}/verify/${certificateId}`;

        const expiryDate = new Date(issueTimestamp);

        expiryDate.setMonth(
          expiryDate.getMonth() + instrument.category.verification_cycle_months,
        );
        const month = issueTimestamp.getUTCMonth();
        const quarter = Math.floor(month / 3) + 1;
        const year = issueTimestamp.getUTCFullYear();

        const stampingQuarterCode = `Q${quarter}-${year}`;
        const certificate = await prisma.digitalCertificate.create({
          data: {
            certificate_no: certificateId,
            stamping_quarter_code: stampingQuarterCode,
            issue_date: issueTimestamp,
            expiry_date: expiryDate,
            sha256_hash: realHash,
            dynamic_qr_url: dynamicQrUrl,
            inspection_id: inspection.inspection_id,
            instrument_id: instrument.instrument_id,
          },
        });

        console.log("Certificate saved:", certificate.cert_id);

        const finalCertPayload = {
          ...data,
          certificateId,
          instrumentSerialNumber: instrument.serial_number,
          instrumentCategory: instrument.category.category_name,
          issueDate: issueTimestamp.toISOString(),
          expiryDate: expiryDate.toISOString(),
          hash: realHash,
          dynamicQrUrl,
        };

        io.emit("certificate_generated", finalCertPayload);
      } catch (error) {
        console.error("Certificate generation failed:", error);

        socket.emit("certificate_error", {
          message: "Failed to generate certificate",
        });
      }
    });
  });

  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });

  app.get("/api/demo", handleDemo);

  app.get("/verify/:certificateId", async (req, res) => {
    try {
      const { certificateId } = req.params;

      const certificate = await prisma.digitalCertificate.findUnique({
        where: {
          certificate_no: certificateId,
        },
        include: {
          instrument: {
            include: {
              category: true,
            },
          },
        },
      });

      if (!certificate) {
        return res.status(404).send(`
        <h2 style="text-align:center;font-family:sans-serif;margin-top:50px;">
          Certificate not found.
        </h2>
      `);
      }

      const htmlPage = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>eMaap Verification</title>
      </head>

      <body>
        <div class="card">
          <h2>VERIFIED LEGAL METROLOGY</h2>

          <p>
            <strong>Instrument:</strong>
            ${certificate.instrument.category.category_name}
          </p>

          <p>
            <strong>Serial Number:</strong>
            ${certificate.instrument.serial_number}
          </p>

          <p>
            <strong>Certificate ID:</strong>
            ${certificate.certificate_no}
          </p>

          <p>
            <strong>Issue Date:</strong>
            ${certificate.issue_date.toISOString()}
          </p>

          <p>
            <strong>Expiry Date:</strong>
            ${certificate.expiry_date.toISOString()}
          </p>

          <p>
            <strong>Cryptographic Hash:</strong>
          </p>

          <div>
            ${certificate.sha256_hash}
          </div>
        </div>
      </body>
      </html>
    `;

      return res.send(htmlPage);
    } catch (error) {
      console.error("Certificate verification failed:", error);

      return res.status(500).send("Internal server error");
    }
  });

  app.get("/api/certificates", async (_req, res) => {
    try {
      const certificates = await prisma.digitalCertificate.findMany({
        include: {
          instrument: {
            include: {
              category: true,
            },
          },
        },
      });

      return res.json(certificates);
    } catch (error) {
      console.error(error);

      return res.status(500).json({
        success: false,
        message: "Failed to fetch certificates",
      });
    }
  });

  return { app, httpServer, io };
}
