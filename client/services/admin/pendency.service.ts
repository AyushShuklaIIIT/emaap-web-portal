import { api } from "@/lib/api";
export type SLAStatus = "BREACHED" | "WITHIN_SLA" | "ALL";
export type AssignedType = "GATC" | "LMO";
export interface PendencyFilters {
  stateCode?: string;
  slaStatus?: SLAStatus;
  page?: number;
  limit?: number;
}

export interface GatcRouteSuggestion {
  gatc_id: string;
  centre_code: string;
  distance_km: number;
}

export interface PendencyItem {
  app_id: string;
  application_no: string;
  submission_timestamp: string;
  days_pending: number;

  business: {
    name: string;
    location: string;
    state_code: string;
  };

  instrument: {
    category: string;
    category_code: string;
    serial_number: string;
    model_no: string;
  };

  sla: {
    status: "BREACHED" | "WITHIN_SLA";
    label: string;
    days_pending: number;
    note: string | null;
  };

  current_assignment: {
    type: "LMO" | "GATC" | null;
    name: string | null;
  };

  suggestions: GatcRouteSuggestion[];

  action: "APPROVE_ROUTE" | "MANUAL_OVERRIDE" | "WAIT";
}

export interface PendencyQueueData {
  items: PendencyItem[];

  summary: {
    total_pending: number;
    breached_count: number;
    sla_days: number;
  };

  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };

  filters: {
    state_code: string;
    sla_status: SLAStatus;
  };
}

export interface ManualOverridePayload {
  assigned_type: AssignedType;
  assigned_id: string;
}

export interface BulkApproveResult {
  app_id: string;
  success: boolean;
  message: string;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export const getPendencyQueue = async (
  filters: PendencyFilters = {},
): Promise<PendencyQueueData> => {
  const response = await api.get<ApiResponse<PendencyQueueData>>(
    "/admin/pendency",
    {
      params: {
        stateCode: filters.stateCode ?? "ALL",
        slaStatus: filters.slaStatus ?? "ALL",
        page: filters.page ?? 1,
        limit: filters.limit ?? 20,
      },
    },
  );

  return response.data.data;
};

export const approvePendencyRoute = async (appId: string, gatcId: string) => {
  const response = await api.patch(`/admin/pendency/${appId}/approve-route`, {
    gatcId,
  });

  return response.data;
};

export const manualOverridePendency = async (
  appId: string,
  payload: ManualOverridePayload,
): Promise<PendencyItem> => {
  const response = await api.patch<ApiResponse<PendencyItem>>(
    `/admin/pendency/${appId}/manual-override`,
    payload,
  );

  return response.data.data;
};

export const bulkApprovePendencyRoutes = async (
  appIds: string[],
): Promise<BulkApproveResult[]> => {
  const response = await api.post<ApiResponse<BulkApproveResult[]>>(
    "/admin/pendency/bulk-approve",
    {
      appIds,
    },
  );

  return response.data.data;
};
