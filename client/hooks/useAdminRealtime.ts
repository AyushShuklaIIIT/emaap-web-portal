import { useEffect } from "react";
import { io } from "socket.io-client";
import { useQueryClient } from "@tanstack/react-query";
import { backendUrl } from "@/lib/backend-url";

export const useAdminRealtime = () => {
  const queryClient = useQueryClient();

  useEffect(() => {
    const socket = io(backendUrl, {
      transports: ["websocket", "polling"],
    });

    socket.on("connect", () => {
      console.log("Admin dashboard socket connected:", socket.id);

      socket.emit("join_admin_dashboard");

      queryClient.invalidateQueries({
        queryKey: ["admin-dashboard"],
      });
      queryClient.invalidateQueries({
        queryKey: ["admin-allocations"],
      });
    });

    socket.on("admin:dashboard:updated", (data) => {
      console.log("Admin dashboard update:", data);

      queryClient.invalidateQueries({
        queryKey: ["admin-dashboard"],
      });
    });

    socket.on("admin:allocations:updated", (data) => {
      console.log("Admin allocations update:", data);

      queryClient.invalidateQueries({
        queryKey: ["admin-allocations"],
      });
    });

    socket.on("disconnect", (reason) => {
      console.log("Admin dashboard socket disconnected:", reason);
    });

    socket.on("connect_error", (error) => {
      console.error("Admin dashboard socket error:", error);
    });

    return () => {
      socket.disconnect();
    };
  }, [queryClient]);
};
