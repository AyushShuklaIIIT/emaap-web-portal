import type { Server } from "socket.io";

export const getOfficerRoom = (officerId: string) => `officer:${officerId}`;

export const getGatcRoom = (gatcId: string) => `gatc:${gatcId}`;

export interface RouteAssignedPayload {
  app_id: string;
  application_no: string;
  assigned_type: "LMO" | "GATC";
  assigned_id: string;
  assigned_to: string | null;
  business_name: string;
  instrument_category: string;
  serial_no: string;
  model_no: string;
  error?: number | null;
  timestamp: string;
  previousCertificateUrl: string | null;
  manufacturerCertificateUrl: string | null;
}

export const emitRouteAssigned = (
  io: Server,
  payload: RouteAssignedPayload,
) => {
  const room =
    payload.assigned_type === "LMO"
      ? getOfficerRoom(payload.assigned_id)
      : getGatcRoom(payload.assigned_id);

  console.log("[SOCKET EMIT]:", payload);
  io.to(room).emit("route:assigned", payload);
};
