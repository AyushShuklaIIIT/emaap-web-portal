import { api } from "@/lib/api";
import {
  FinancialReportFilters,
  FinancialReportApiResponse,
} from "../financial.service";

export interface StateAdminFinancialFilters extends FinancialReportFilters {
  district?: string;
  gatcId?: string;
}

export const getStateFinancialReport = async (
  filters: StateAdminFinancialFilters = {},
) => {
  try {
    const response = await api.get<FinancialReportApiResponse>(
      "/state-admin/financial",
      {
        params: filters,
      },
    );

    return response.data.data;
  } catch (error: any) {
    throw new Error(
      error.response?.data?.message || "Failed to fetch state financial report",
    );
  }
};

export const exportStateFinancialReport = async (
  filters: StateAdminFinancialFilters = {},
) => {
  try {
    const response = await api.get("/state-admin/financial/export", {
      params: filters,
      responseType: "blob",
    });

    const blob = new Blob([response.data]);

    const contentDisposition = response.headers["content-disposition"];
    let filename = "state-financial-report.csv";
    if (contentDisposition) {
      const match = contentDisposition.match(/filename="?([^"]+)"?/);
      if (match?.[1]) {
        filename = match[1];
      }
    }

    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.URL.revokeObjectURL(url);
  } catch (error: any) {
    throw new Error(
      error.response?.data?.message ||
        "Failed to export state financial report",
    );
  }
};
