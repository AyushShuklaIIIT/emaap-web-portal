import type { Server } from "socket.io";

export const emitAdminDashboardUpdate = (io: Server, reason: string) => {
  io.to("admin-dashboard").emit("admin:dashboard:updated", {
    reason,
    timestamp: new Date().toISOString(),
  });
};

export const emitAdminAllocationsUpdate = (io: Server, reason: string) => {
  io.to("admin-dashboard").emit("admin:allocations:updated", {
    reason,
    timestamp: new Date().toISOString(),
  });
};
