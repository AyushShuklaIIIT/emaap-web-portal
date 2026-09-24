import { api } from "@/lib/api";
import {
  PendencyQueueData,
  ApprovalRoutePayload,
  ManualOverridePayload,
  PendencyItem,
  BulkApproveResult,
} from "../pendency.service";

export type SLAStatus = "BREACHED" | "WITHIN_SLA" | "ALL";

export interface StatePendencyFilters {
  district?: string;
  slaStatus?: SLAStatus;
  page?: number;
  limit?: number;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export const getStatePendencyQueue = async (
  filters: StatePendencyFilters = {},
): Promise<PendencyQueueData> => {
  const response = await api.get<ApiResponse<PendencyQueueData>>(
    "/state-admin/pendency",
    {
      params: filters,
    },
  );
  return response.data.data;
};

export const approveStatePendencyRoute = async (
  appId: string,
  route: ApprovalRoutePayload,
) => {
  const response = await api.patch(
    `/state-admin/pendency/${appId}/approve-route`,
    route,
  );
  return response.data;
};

export const manualOverrideStatePendency = async (
  appId: string,
  payload: ManualOverridePayload,
): Promise<PendencyItem> => {
  const response = await api.patch<ApiResponse<PendencyItem>>(
    `/state-admin/pendency/${appId}/manual-override`,
    payload,
  );
  return response.data.data;
};

export const bulkApproveStatePendencyRoutes = async (
  appIds: string[],
): Promise<BulkApproveResult[]> => {
  const response = await api.post<ApiResponse<BulkApproveResult[]>>(
    "/state-admin/pendency/bulk-approve",
    { appIds },
  );
  return response.data.data;
};
