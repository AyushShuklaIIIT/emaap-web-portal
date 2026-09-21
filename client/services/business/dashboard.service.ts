import { api } from "@/lib/api";
import type { DashboardApplicationData } from "../../../server/types";

export interface BusinessDashboard {
  active_instruments: number;
  expires_in: number;
  pending: number;
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

export const getApplicationsDashboard = async (userId: string): Promise<DashboardApplicationData[]> => {
  const response = await api.get(`/dashboard/${userId}/applications`);
  const applications = response.data?.data;

  if (!Array.isArray(applications)) {
    throw new Error("Applications response did not contain a list");
  }

  return applications;
};
