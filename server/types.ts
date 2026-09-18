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
