import { api } from "@/lib/api";

export type PendencySeverity = "HIGH" | "MEDIUM" | "NORMAL";
export type AssignedType = "LMO" | "GATC";
export type WorkflowStatus =
  "SUBMITTED" | "ALLOCATED" | "CERTIFIED" | "REJECTED";

export interface AdminKpis {
  total_revenue_collected: number;
  government_share: number;
  gatc_share: number;
  revenue_growth_yoy_percent: number | null;
  active_gatcs_lmos: number;
  active_gatcs: number;
  lmos: number;
  national_pendency_rate: number;
  total_instruments_verified: number;
  cryptographically_secured_percentage: number;
  highest_pendency_state: string | null;
}

export interface MonthlyVerificationVolume {
  month: string;
  lmo: number;
  gatc: number;
}

export interface StatePendency {
  state_code: string;
  state_name: string;
  pending_applications: number;
  total_applications: number;
  pendency_rate: number;
  severity: PendencySeverity;
}

export interface AdminDashboardData {
  financial_year: string;
  kpis: AdminKpis;
  monthly_verification_volume: MonthlyVerificationVolume[];
  critical_pendency_by_state: StatePendency[];
}

export interface AdminAllocation {
  app_id: string;
  application_no: string;
  instrument: string;
  serial_number: string;
  assigned_type: "LMO" | "GATC" | null;
  assigned_to: string | null;
  distance_km: number | null;
  workflow_status: WorkflowStatus;
  submission_timestamp: string;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export const getAdminDashboard = async (
  financialYear: string,
): Promise<AdminDashboardData> => {
  const response = await api.get<ApiResponse<AdminDashboardData>>(
    "/admin/dashboard",
    {
      params: {
        financialYear,
      },
    },
  );

  console.log("ADMIN DASHBOARD RESPONSE:", response.data);

  if (!response.data || response.data.data === undefined) {
    throw new Error("Admin dashboard API returned no data");
  }

  return response.data.data;
};

export const getAdminAllocations = async (): Promise<AdminAllocation[]> => {
  const response =
    await api.get<ApiResponse<AdminAllocation[]>>("/admin/allocations");

  console.log("ADMIN ALLOCATIONS RESPONSE:", response.data);

  if (!response.data || response.data.data === undefined) {
    throw new Error("Admin allocations API returned no data");
  }

  return response.data.data;
};

export const exportAdminDashboard = async (
  financialYear: string,
): Promise<Blob> => {
  const response = await api.get("/admin/dashboard/export", {
    params: {
      financialYear,
    },

    responseType: "blob",
  });

  return response.data;
};

export const downloadAdminDashboardReport = async (financialYear: string) => {
  const blob = await exportAdminDashboard(financialYear);
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = `admin-report-${financialYear}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};
