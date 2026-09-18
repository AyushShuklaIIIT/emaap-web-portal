import { api } from "@/lib/api";

export type PaymentMethod = "UPI" | "NET_BANKING" | "NEFT_RTGS";
export type PaymentStatus = "PENDING" | "SUCCESS" | "FAILED";
export type AppType = "INITIAL" | "RE_VERIFICATION";
export type WorkflowStatus =
  "SUBMITTED" | "ALLOCATED" | "CERTIFIED" | "REJECTED";
export type AccuracyClass = "CLASS_I" | "CLASS_II" | "CLASS_III" | "CLASS_IIII";
export type InstrumentStatus = "VERIFIED" | "REJECTED" | "EXPIRED";
export interface PaymentDashboardData {
  total_paid_ytd: number;
  pending_payments: PendingPayment[];
  recent_transactions: RecentTransaction[];
}

export interface PendingPayment {
  receipt_id: string;
  receipt_no: string;
  application_id: string;
  instrument: string;
  due_date: string | null;
  statutory_fee: number;
  total_amount: number;
}

export interface RecentTransaction {
  receipt_id: string;
  transaction_id: string | null;
  transaction_date: string | null;
  application_id: string;
  instrument: string;
  payment_method: PaymentMethod | null;
  total_amount: number;
  payment_status: PaymentStatus;
}

export interface PaymentReceiptDetails {
  receipt_id: string;
  receipt_no: string;
  transaction_id: string | null;
  transaction_date: string | null;
  payment_method: PaymentMethod | null;
  due_date: string | null;
  statutory_fee: number;
  carriage_charges: number;
  adjusting_charges: number;
  total_amount: number;
  govt_share: number;
  gatc_share: number;
  payment_status: PaymentStatus;
  app_id: string;

  application: {
    app_id: string;
    application_no: string;
    app_type: AppType;
    submission_timestamp: string;
    workflow_status: WorkflowStatus;
    instrument_id: string;
    business_id: string;
    assigned_officer_id: string | null;
    assigned_gatc_id: string | null;

    instrument: {
      instrument_id: string;
      serial_number: string;
      model_no: string;
      model_approval_no: string | null;
      manufacturer_name: string;
      accuracy_class: AccuracyClass;
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
      status: InstrumentStatus;

      category: {
        category_id: string;
        category_code: string;
        category_name: string;
        accuracy_class: AccuracyClass;
        oiml_standard_ref: string;
        verification_cycle_months: number;
      };
    };
  };
}

export const getPaymentDashboard = async (
  userId: string,
): Promise<PaymentDashboardData> => {
  const response = await api.get(`/payment/${userId}`);

  return response.data.data;
};

export const getPaymentReceipt = async (
  userId: string,
  receiptId: string,
): Promise<PaymentReceiptDetails> => {
  const response = await api.get(`/payment/${userId}/receipts/${receiptId}`);

  return response.data.data;
};
