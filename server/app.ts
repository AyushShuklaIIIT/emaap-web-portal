import "dotenv/config";
import express from "express";
import cors from "cors";
import { handleDemo } from "./routes/demo";
import { createServer as createHttpServer } from "http";
import { Server as SocketIOServer } from "socket.io";

export function createServer() {
  const app = express();

  const httpServer = createHttpServer(app);

  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  io.on("connection", (socket) => {
    console.log(`socket connected:${socket.id}`);

    socket.on("message", (data) => {
      console.log(`Recieved data:${JSON.stringify(data)}`);

      socket.emit("reply", "Whatup");
    });

    socket.on("disconnect", (reason) => {
      console.log(reason);
    });
  });

  // Example API routes
  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });

  app.get("/api/demo", handleDemo);

  return { app, httpServer, io };
}
