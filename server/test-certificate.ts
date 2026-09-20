import { io } from "socket.io-client";

const socket = io("http://localhost:8008", {
  transports: ["websocket"],
});

socket.on("connect", () => {
  console.log("Connected:", socket.id);

  socket.emit("inspection_approved", {
    inspectionId: "cb563a06-fa21-4e69-b599-8c2e0944cf68",
    sealImageBase64: "test-seal-image",
  });
});

socket.on("certificate_generated", (data) => {
  console.log("CERTIFICATE GENERATED:");
  console.log(data);
  socket.disconnect();
  process.exit(0);
});

socket.on("certificate_error", (error) => {
  console.error("CERTIFICATE ERROR:", error);
  socket.disconnect();
  process.exit(1);
});

socket.on("connect_error", (error) => {
  console.error("Connection error:", error.message);
});
