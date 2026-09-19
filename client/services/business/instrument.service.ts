import { api } from "@/lib/api";

export interface Instrument {
  instrument_id: string;
  serial_number: string;
  model_no: string;
  model_approval_no: string | null;
  manufacturer_name: string;

  accuracy_class: "CLASS_I" | "CLASS_II" | "CLASS_III" | "CLASS_IIII";

  metric: string;
  address: string;
  pincode: number;
  state: string;

  lat: number;
  long: number;

  capacity_value: string | null;
  capacity_unit: string | null;

  business_id: string;
  category_id: string;

  status: "VERIFIED" | "REJECTED" | "EXPIRED";

  category: InstrumentCategory;
  certificates: Certificate[];
}

export interface InstrumentCategory {
  category_id: string;
  category_code: string;
  category_name: string;

  accuracy_class: "CLASS_I" | "CLASS_II" | "CLASS_III" | "CLASS_IIII";

  oiml_standard_ref: string;
  verification_cycle_months: number;
}

export interface Certificate {
  cert_id: string;
  certificate_no: string;
  stamping_quarter_code: string;

  issue_date: string;
  expiry_date: string;

  sha256_hash: string;
  dynamic_qr_url: string;
  rejection_reason: string | null;

  inspection_id: string;
  instrument_id: string;
}

export const getVerifiedInstruments = async (
  userId: string,
): Promise<Instrument[]> => {
  const response = await api.get(`/instrument/${userId}`);

  return response.data.data;
};

export const getInstrumentSearch = async (
  userId: string,
  input: string,
): Promise<Instrument[]> => {
  const response = await api.get(
    `/instrument/${userId}/${encodeURIComponent(input)}/search`,
  );

  return response.data.data;
};
