import { api } from "@/lib/api";

export interface VerificationAppData {
  app_id: string;
  application_no: string;
  app_type: "INITIAL" | "RE_VERIFICATION";
  submission_timestamp: Date;
  workflow_status: "SUBMITTED" | "ALLOCATED" | "CERTIFIED" | "REJECTED";

  instrument_id: string;
  business_id: string;
  assigned_officer_id?: string;
  assigned_gatc_id?: string;
}

export interface VerificationForm {
  applicationId: string;
  instrumentCategory: string;
  instrumentSubCategory: string;
  modelNo: string;
  accuracyClass: "Class I" | "Class II" | "Class III" | "Class IIII";
  manufacturerName: string;
  instrumentSerialNumber: string;
  metric: string;
  address: string;
  pincode: number;
  state: string;
  lat: number;
  long: number;
}

export const getVerificationApp = async (
  userId: string,
): Promise<VerificationAppData> => {
  const response = await api.get(`/verification/${userId}`);

  return response.data.data;
};

export const postVerificationApp = async (
  userId: string,
  data: VerificationForm,
): Promise<VerificationAppData> => {
  const response = await api.post(`/verification/${userId}`, data);

  return response.data.data;
};
