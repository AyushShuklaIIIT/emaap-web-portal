import { api } from "@/lib/api";
import type { DashboardApplicationData } from "../../../server/types";

export interface BusinessDashboard {
  active_instruments: number;
  expires_in: number;
  pending: number;
}

export interface PaginatedApplications {
  data: DashboardApplicationData[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const getBusinessDashboard = async (
  userId: string,
): Promise<BusinessDashboard> => {
  const response = await api.get(`/dashboard/${userId}`);
  const dashboard = response.data?.data;

  if (!dashboard) {
    throw new Error("Dashboard response did not contain data");
  }

  return dashboard;
};

export const getApplicationsDashboard = async (
  userId: string,
  page: number,
  limit: number,
): Promise<PaginatedApplications> => {
  const response = await api.get(`/dashboard/${userId}/applications`, {
    params: { page, limit },
  });
  const result = response.data;

  if (!result || !Array.isArray(result.data)) {
    throw new Error("Applications response did not contain a valid list");
  }

  return {
    data: result.data,
    pagination: result.pagination,
  };
};
