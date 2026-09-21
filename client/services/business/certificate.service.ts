import { api } from "@/lib/api";

export interface CertificateApiResponse {
  cert_id: string;
  certificate_no: string;
  issue_date: string;
  expiry_date: string;
  sha256_hash: string;
  dynamic_qr_url: string;
  rejection_reason: string | null;
  inspection_id: string;
  instrument_id: string;
  verificationSignature?: string;

  instrument: {
    serial_number: string;

    category: {
      category_name: string;
    };
  };
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export const getCertificates = async (
  userId: string,
): Promise<CertificateApiResponse[]> => {
  const response = await api.get<ApiResponse<CertificateApiResponse[]>>(
    `/certificates/${userId}`,
  );

  return response.data.data;
};
