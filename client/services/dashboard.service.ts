import { api } from "../lib/api";

export interface BusinessDashboard {
  active_instruments: number;
  expires_in: number;
  pending: number;
}

export interface VerificationCertificateApp {
  app_id: string;
  application_no: string;
  app_type: "INITIAL" | "RE_VERIFICATION";
  submission_timestamp: string;
  workflow_status: "SUBMITTED" | "ALLOCATED" | "CERTIFIED" | "REJECTED";
  instrument_id: string;
  business_id: string;
  assigned_officer_id: string | null;
  assigned_gatc_id: string | null;
  cert_id: string | null;
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
): Promise<VerificationCertificateApp[]> => {
  const response = await api.get(`/dashboard/${userId}/applications`);
  const applications = response.data?.data;

  if (!Array.isArray(applications)) {
    throw new Error("Applications response did not contain a list");
  }

  return applications;
};
