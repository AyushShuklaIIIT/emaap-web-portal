export type AppType = "INITIAL" | "RE_VERIFICATION";

export type WorkflowStatus =
  "SUBMITTED" | "ALLOCATED" | "CERTIFIED" | "REJECTED";

export type PaymentStatus = "PENDING" | "SUCCESS" | "FAILED";

export type PaymentMethod = "UPI" | "NET_BANKING" | "NEFT_RTGS";

export interface FinancialReportFilters {
  startDate?: string;
  endDate?: string;

  search?: string;

  applicationType?: AppType;
  workflowStatus?: WorkflowStatus;
  paymentStatus?: PaymentStatus;

  page?: number;
  limit?: number;
}

export interface FinancialSummary {
  grossRevenue: number;
  statutoryFees: number;
  carriageCharges: number;
  adjustingCharges: number;

  stateTreasuryShare: number;
  gatcShare: number;

  transactionCount: number;
}

export interface RevenueTrend {
  month: string;

  verificationFees: number;
  carriageCharges: number;
  adjustingCharges: number;

  totalRevenue: number;
}

export interface RevenueDistribution {
  governmentPercentage: number;
  gatcPercentage: number;

  governmentAmount: number;
  gatcAmount: number;
}

export interface FinancialTransaction {
  receiptId: string;
  receiptNo: string;

  transactionId: string | null;
  transactionDate: string | null;

  businessName: string;
  registrationNumber: string;

  applicationType: AppType;
  workflowStatus: WorkflowStatus;

  instrumentCategory: string;
  instrumentModel: string;
  instrumentSerialNumber: string;

  statutoryFee: number;
  carriageCharges: number;
  adjustingCharges: number;

  totalAmount: number;

  govtShare: number;
  gatcShare: number;

  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod | null;
}

export interface FinancialReportResponse {
  summary: FinancialSummary;

  trends: RevenueTrend[];

  distribution: RevenueDistribution;

  transactions: FinancialTransaction[];

  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface FinancialReportApiResponse {
  success: boolean;
  data: FinancialReportResponse;
}

import { backendUrl } from "@/lib/backend-url";

const BASE_URL = `${backendUrl}/api/admin/financial`;

const buildQueryString = (filters: FinancialReportFilters = {}) => {
  const params = new URLSearchParams();

  if (filters.startDate) {
    params.set("startDate", filters.startDate);
  }

  if (filters.endDate) {
    params.set("endDate", filters.endDate);
  }

  if (filters.search) {
    params.set("search", filters.search);
  }

  if (filters.applicationType) {
    params.set("applicationType", filters.applicationType);
  }

  if (filters.workflowStatus) {
    params.set("workflowStatus", filters.workflowStatus);
  }

  if (filters.paymentStatus) {
    params.set("paymentStatus", filters.paymentStatus);
  }

  if (filters.page) {
    params.set("page", String(filters.page));
  }

  if (filters.limit) {
    params.set("limit", String(filters.limit));
  }

  const query = params.toString();

  return query ? `?${query}` : "";
};

export const getFinancialReport = async (
  filters: FinancialReportFilters = {},
) => {
  const query = buildQueryString(filters);

  const response = await fetch(`${BASE_URL}${query}`, {
    method: "GET",

    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => null);

    throw new Error(errorBody?.message || "Failed to fetch financial report");
  }

  const result = (await response.json()) as FinancialReportApiResponse;

  if (!result.success) {
    throw new Error("Failed to fetch financial report");
  }

  return result.data;
};

export const exportFinancialReport = async (
  filters: FinancialReportFilters = {},
) => {
  const query = buildQueryString(filters);

  const response = await fetch(`${BASE_URL}/export${query}`, {
    method: "GET",
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => null);

    throw new Error(errorBody?.message || "Failed to export financial report");
  }

  const blob = await response.blob();

  const contentDisposition = response.headers.get("Content-Disposition");

  let filename = "financial-report.csv";

  const match = contentDisposition?.match(/filename="?([^"]+)"?/);

  if (match?.[1]) {
    filename = match[1];
  }

  const url = window.URL.createObjectURL(blob);

  const anchor = document.createElement("a");

  anchor.href = url;
  anchor.download = filename;

  document.body.appendChild(anchor);

  anchor.click();

  anchor.remove();

  window.URL.revokeObjectURL(url);
};
