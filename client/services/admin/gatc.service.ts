export interface GatcRevenue {
  total: number;
  govt_share: number;
  gatc_share: number;
}

export interface GatcPrincipalOfficer {
  user_id: string;
  name: string;
  email: string;
  mobile: string;
  employeeId?: string | null;
}

export type GatcStatus = "ACTIVE" | "SUSPENDED" | "REVOKED";

export interface GatcListItem {
  gatc_id: string;
  centre_code: string;
  lab_name: string;
  approval_cert_no: string;
  ind_mark_code: string;

  status: GatcStatus;

  valid_from: string;
  valid_to: string;

  approved_categories: string[];

  principal_officer: GatcPrincipalOfficer;

  revenue: GatcRevenue;
}

export interface GatcDashboard {
  totalActiveGatcs: number;
  totalGatcs: number;

  statesCovered: number;
  unionTerritoriesCovered: number;

  revenueYtd: GatcRevenue;

  pendingLabRenewals: number;
}

export interface GatcListResponse {
  success: boolean;

  data: GatcListItem[];

  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface GatcDashboardResponse {
  success: boolean;
  data: GatcDashboard;
}

export interface GatcProfile extends GatcListItem {
  applications: number;
  successfulPayments: number;

  inspections: number;
  passedInspections: number;
  failedInspections: number;
}

export interface CreateGatcPayload {
  centre_code: string;
  approval_cert_no: string;
  ind_mark_code: string;
  valid_from: string;
  valid_to: string;
  approved_categories: string[];
  lat: number;
  long: number;
  principal_officer_id: string;
}

export interface RenewGatcPayload {
  valid_from: string;
  valid_to: string;
  approval_cert_no?: string;
  ind_mark_code?: string;
  approved_categories?: string[];
}

const API_BASE_URL =
  import.meta.env.VITE_BACKEND_URL?.trim() || "http://localhost:8008";

const GATC_BASE_URL = `${API_BASE_URL}/api/admin/gatcs`;

const getErrorMessage = async (response: Response) => {
  try {
    const body = await response.json();

    return body?.message || `Request failed with status ${response.status}`;
  } catch {
    return `Request failed with status ${response.status}`;
  }
};

const request = async <T>(url: string, options?: RequestInit): Promise<T> => {
  const response = await fetch(url, {
    ...options,

    headers: {
      "Content-Type": "application/json",
      ...(options?.headers ?? {}),
    },
  });

  if (!response.ok) {
    throw new Error(await getErrorMessage(response));
  }

  return response.json();
};

export const gatcService = {
  async getDashboard(): Promise<GatcDashboard> {
    const response = await request<GatcDashboardResponse>(
      `${GATC_BASE_URL}/dashboard`,
    );

    return response.data;
  },

  async getGatcs(params?: {
    search?: string;
    status?: GatcStatus;
    page?: number;
    limit?: number;
  }): Promise<GatcListResponse> {
    const searchParams = new URLSearchParams();

    if (params?.search) {
      searchParams.set("search", params.search);
    }

    if (params?.status) {
      searchParams.set("status", params.status);
    }

    if (params?.page) {
      searchParams.set("page", String(params.page));
    }

    if (params?.limit) {
      searchParams.set("limit", String(params.limit));
    }

    const query = searchParams.toString();

    return request<GatcListResponse>(
      `${GATC_BASE_URL}${query ? `?${query}` : ""}`,
    );
  },

  async getGatcProfile(gatcId: string): Promise<GatcProfile> {
    const response = await request<{
      success: boolean;
      data: GatcProfile;
    }>(`${GATC_BASE_URL}/${gatcId}`);

    return response.data;
  },

  async createGatc(payload: CreateGatcPayload): Promise<GatcListItem> {
    const response = await request<{
      success: boolean;
      data: GatcListItem;
    }>(GATC_BASE_URL, {
      method: "POST",
      body: JSON.stringify(payload),
    });

    return response.data;
  },

  async updateStatus(
    gatcId: string,
    status: GatcStatus,
  ): Promise<GatcListItem> {
    const response = await request<{
      success: boolean;
      data: GatcListItem;
    }>(`${GATC_BASE_URL}/${gatcId}/status`, {
      method: "PATCH",
      body: JSON.stringify({
        status,
      }),
    });

    return response.data;
  },

  async renewGatc(
    gatcId: string,
    payload: RenewGatcPayload,
  ): Promise<GatcListItem> {
    const response = await request<{
      success: boolean;
      data: GatcListItem;
    }>(`${GATC_BASE_URL}/${gatcId}/renew`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });

    return response.data;
  },
};
