import { useEffect, useState } from "react";
import { io } from "socket.io-client";

const socket = io("http://localhost:8008", {
  autoConnect: false,
});

export default function SocketTest() {
  const [connected, setConnected] = useState(false);
  const [socketId, setSocketId] = useState<string | undefined>();
  const [message, setMessage] = useState("");

  useEffect(() => {
    const onConnect = () => {
      console.log("Socket connected:", socket.id);

      setConnected(true);
      setSocketId(socket.id);
    };

    const onDisconnect = () => {
      console.log("Socket disconnected");

      setConnected(false);
      setSocketId(undefined);
    };

    const onConnectError = (error: Error) => {
      console.error("Socket connection error:", error.message);
    };

    socket.on("reply", (data) => {
      console.log(JSON.stringify(data));
    });

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("connect_error", onConnectError);

    socket.connect();

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("connect_error", onConnectError);

      socket.disconnect();
    };
  }, []);

  const sendMessage = () => {
    socket.emit("message", {
      text: message,
    });

    console.log("Sent:", message);
    setMessage("");
  };

  return (
    <div style={{ padding: "2rem" }}>
      <h1>Socket.IO Test</h1>

      <p>
        Status: <strong>{connected ? "Connected" : "Disconnected"}</strong>
      </p>

      {socketId && <p>Socket ID: {socketId}</p>}

      <input
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Enter message"
      />

      <button onClick={sendMessage} disabled={!connected}>
        Send Message
      </button>
    </div>
  );
}
