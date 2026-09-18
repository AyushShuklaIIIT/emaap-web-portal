import { Prisma } from "./generated/prisma/client";

export interface State {
  state_code: string;
  state_name: string;
}

export interface User {
  name: string;
  email: string;
  role: "BUSINESS" | "LMO" | "GATC_PRINCIPAL" | "ADMIN";
  jurisdiction_district?: string;
  jurisdiction_state?: string;
}

export interface GatcUser extends User {
  centre_code: string;
  approval_cert_no: string;
  ind_mark_code: string;
  valid_from: Date;
  valid_to: Date;
  status: "ACTIVE" | "SUSPENDED" | "REVOKED";
  approved_categories: string[];
  lat: number;
  long: number;
}

export interface BusinessUser extends User {
  registration_number: string;
  trade_name: string;
  entity_type: "MANUFACTURER" | "DEALER" | "USER";
  geo_address: string;
  state_code: string;
}

export interface FeeRuleSeed {
  state_code: string;
  category_code: string;
  min_value?: number;
  max_value?: number;
  unit: string;
  fee_amount: number;
  fee_basis: "PER_PIECE" | "PER_METRE" | "PER_LITRE" | "FIXED";
  condition?: string;
  additional_fee?: number;
  additional_unit?: number;
  maximum_fee?: number;
}

export interface VerificationApp {
  app_id: string;
  application_no: string;
  app_type: "INITIAL" | "RE_VERIFICATION";
  submission_timestamp: Date;
  workflow_status: "SUBMITTED" | "ALLOCATED" | "CERTIFIED" | "REJECTED";
  instrument_id: string;
  business_id: string;
  assigned_officer_id?: string;
  assigned_gatc_id?: string;
  cert_id?: string;
}

export interface Certificate {
  cert_id: string;
  certificate_no: string;
  stamping_quarter_code: string;
  issue_date: Date;
  expiry_date: Date;
  sha256_hash: string;
  dynamic_qr_url: string;
  rejection_reason: string | null;
  inspection_id: string;
  instrument_id: string;
}

export interface Instrument {
  instrument_id: string;
  serial_number: string;
  model_approval_no: string;
  manufacturer_name: string;
  capacity_value: Prisma.Decimal;
  capacity_unit: string | null;
  geo_location: string;
  business_id: string;
  category_id: string;
  status: "VERIFIED" | "REJECTED" | "EXPIRED";

  certificates: Certificate[];
}

export interface InspectionData {
  inspection_date: Date;
  time_taken_minutes: number;
  inspection_mode: "FIELD_OFFLINE" | "LAB";
  test_verdict: "PASS" | "FAIL";
  geo_latitude: number;
  geo_longitude: number;

  application_no: string;
  inspector_email: string;
}

export interface DigitalCertificateData {
  certificate_no: string;
  stamping_quarter_code: string;
  issue_date: Date;
  expiry_date: Date;
  sha256_hash: string;
  dynamic_qr_url: string;
  rejection_reason: string | null;

  application_no: string;
  instrument_serial_number: string;
}
