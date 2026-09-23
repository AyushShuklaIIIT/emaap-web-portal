import { api } from "@/lib/api";

export interface GatcDashboardOfficer {
  user_id: string;
  full_name: string;
  name: string;
  email: string;
  mobile: string;
  employee_id: string | null;
  is_active: boolean;
  email_verified: boolean;
  mobile_verified: boolean;
  status: "ASSIGNED" | "FREE";
}

export interface GatcDashboardResponse {
  principal: {
    user_id: string;
    name: string;
    full_name: string;
    email: string;
    mobile: string;
    email_verified: boolean;
    mobile_verified: boolean;
  };

  gatc: {
    gatc_id: string;
    centre_code: string;
    approval_cert_no: string;
    ind_mark_code: string;
    valid_from: string;
    valid_to: string;
    status: string;
    approved_categories: string[];
  };

  metrics: {
    total_officers: number;
    assigned_officers: number;
    free_officers: number;
    total_revenue: number;
  };

  revenue: Array<{
    date: string;
    revenue: number;
  }>;

  officers: GatcDashboardOfficer[];
}

export interface RegisterGatcOfficerPayload {
  fullName: string;
  email: string;
  mobile: string;
  employeeId: string;
}

export interface RegisterGatcOfficerResponse {
  officer: {
    user_id: string;
    name: string;
    fullName: string;
    email: string;
    mobile: string;
    employeeId: string | null;
    registrationRole: string;
    isActive: boolean;
  };

  temporary_password: string;
}

export interface GatcSettingsResponse {
  principal: {
    user_id: string;
    name: string;
    full_name: string;
    email: string;
    mobile: string;
    email_verified: boolean;
    mobile_verified: boolean;
  };

  gatc: {
    gatc_id: string;
    centre_code: string;
    approval_cert_no: string;
    ind_mark_code: string;
    valid_from: string;
    valid_to: string;
    status: string;
    approved_categories: string[];
  };
}

export const getGatcDashboard = async () => {
  const response = await api.get<{
    success: boolean;
    data: GatcDashboardResponse;
  }>("/gatc/dashboard");

  return response.data.data;
};

export const registerGatcOfficer = async (
  payload: RegisterGatcOfficerPayload,
) => {
  const response = await api.post<{
    success: boolean;
    message: string;
    data: RegisterGatcOfficerResponse;
  }>("/gatc/register-officer", payload);

  return response.data.data;
};

export const getGatcSettings = async () => {
  const response = await api.get<{
    success: boolean;
    data: GatcSettingsResponse;
  }>("/gatc/settings");

  return response.data.data;
};
