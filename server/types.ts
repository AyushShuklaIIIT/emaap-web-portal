import { Prisma } from "./generated/prisma/client";

export interface State {
  state_code: string;
  state_name: string;
}

export interface User {
  user_id?: string;
  name: string;
  fullName: string;
  email: string;
  mobile: string;
  role: "BUSINESS" | "LMO" | "GATC_PRINCIPAL" | "ADMIN";
  registrationRole:
    "STAKEHOLDER" | "INSPECTOR" | "ADMIN" | "LEGAL_OFFICER" | "GATC_OPERATOR";
  password?: string;
  passwordHash?: string;
  jurisdiction_district?: string;
  jurisdiction_state?: string;
}

export interface GatcUser extends User {
  role: "GATC_PRINCIPAL";
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
  role: "BUSINESS";
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

export interface VerificationAppSeedData {
  application_no: string;
  app_type: "INITIAL" | "RE_VERIFICATION";
  workflow_status: "SUBMITTED" | "ALLOCATED" | "CERTIFIED" | "REJECTED";
  business_email: string;
  instrument_serial_number: string;
  assigned_officer_email?: string;
  assigned_gatc_code?: string;
}

export type VerificationAppData = Prisma.VerificationAppGetPayload<{
  include: {
    receipts: true;
    inspections: true;
    instrument: true;
    business: true;
    assigned_officer: true;
    assigned_gatc: true;
  };
}>;

export type DashboardApplicationData = Prisma.VerificationAppGetPayload<{
  include: {
    instrument: {
      include: {
        category: true;
        technical_specs: true;
        business: {
          include: {
            state: true;
            user: true;
          };
        };
        certificates: true;
      };
    };
    business: {
      include: {
        state: true;
        user: true;
      };
    };
    assigned_officer: true;
    assigned_gatc: {
      include: {
        principal_officer: true;
      };
    };
    receipts: true;
    inspections: {
      include: {
        inspector: true;
        certificate: {
          include: {
            instrument: true;
          };
        };
        seals: true;
      };
    };
  };
}>;

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
  capacity_value: Prisma.Decimal | null;
  capacity_unit: string | null;
  business_id: string;
  category_id: string;
  status: "PENDING" | "VERIFIED" | "REJECTED" | "EXPIRED";
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
}

export interface PaymentData {
  receipt_id: string;
  receipt_no: string;
  transaction_id: string | null;
  transaction_date: Date | null;
  payment_method: "UPI" | "NET_BANKING" | "NEFT_RTGS" | null;
  due_date: Date | null;
  statutory_fee: number;
  carriage_charges: number;
  adjusting_charges: number;
  total_amount: number;
  govt_share: number;
  gatc_share: number;
  payment_status: "PENDING" | "SUCCESS" | "FAILED";
  app_id: string;
}

export interface PaymentDashboardData {
  total_paid_ytd: number;
  pending_payments: {
    receipt_id: string;
    receipt_no: string;
    application_id: string;
    instrument: string;
    due_date: Date | null;
    statutory_fee: number;
    total_amount: number;
  }[];
  recent_transactions: {
    receipt_id: string;
    transaction_id: string | null;
    transaction_date: Date | null;
    application_id: string;
    instrument: string;
    payment_method: "UPI" | "NET_BANKING" | "NEFT_RTGS" | null;
    total_amount: number;
    payment_status: "PENDING" | "SUCCESS" | "FAILED";
  }[];
}
