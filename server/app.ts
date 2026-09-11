import "dotenv/config";
import express from "express";
import crypto from 'node:crypto'
import cors from "cors";
import { handleDemo } from "./routes/demo";
import { createServer as createHttpServer } from "node:http";
import { Server as SocketIOServer } from "socket.io";
import { router as uploadRouter } from "./routes/app.routes";

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
      console.log("Tanishq ne approve kar diya hai! Aage jaane do...")
      const issueTimestamp = new Date().toISOString()
      const rawDataToHash = `${data.instrumentSerialNumber}|${data.lat},${data.long}|${issueTimestamp}|LMO-MP-1048|${data.sealImageBase64}`;
      const realHash = crypto.createHash("sha256").update(rawDataToHash).digest("hex");
      console.log("Generated Cryptographic Hash:", realHash);

      io.emit("certificate_generated", {
        ...data,
        certificateId: `CERT-${crypto.randomUUID}`,
        issueDate: issueTimestamp,
        hash: realHash
      })
    })
  });

  // Example API routes
  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });

  app.get("/api/demo", handleDemo);

  return { app, httpServer, io };
}
