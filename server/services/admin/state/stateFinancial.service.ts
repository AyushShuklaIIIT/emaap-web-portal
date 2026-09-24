import {
  AppType,
  PaymentMethod,
  PaymentStatus,
  WorkflowStatus,
} from "../../../generated/prisma/enums";
import {
  findStateFinancialReceipts,
  findStateFinancialTransactions,
} from "../../../repositories/stateFinancial.repository";

const roundMoney = (value: number) =>
  Math.round((value + Number.EPSILON) * 100) / 100;
const parseStartDate = (date?: string) =>
  date ? new Date(`${date}T00:00:00.000Z`) : undefined;
const parseEndDate = (date?: string) =>
  date ? new Date(`${date}T23:59:59.999Z`) : undefined;
const getMonthKey = (date: Date) =>
  `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
const formatMonth = (date: Date) =>
  date.toLocaleString("en-IN", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });

export interface StateFinancialReportFilters {
  startDate?: string;
  endDate?: string;
  search?: string;
  district?: string;
  gatcId?: string;
  applicationType?: AppType;
  workflowStatus?: WorkflowStatus;
  paymentStatus?: PaymentStatus;
  page?: number;
  limit?: number;
}

export interface FinancialTransaction {
  receiptId: string;
  receiptNo: string;
  transactionId: string | null;
  transactionDate: string | null;
  businessName: string;
  registrationNumber: string;
  district: string | null;
  gatcId: string | null;
  applicationType: AppType;
  workflowStatus: WorkflowStatus;
  instrumentCategory: string;
  instrumentModel: string;
  instrumentSerialNumber: string;
  statutoryFee: number;
  carriageCharges: number;
  adjustingCharges: number;
  totalAmount: number;
  govtShare: number;
  gatcShare: number;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
}

const mapTransaction = (receipt: any): FinancialTransaction => {
  const app = receipt.application;
  return {
    receiptId: receipt.receipt_id,
    receiptNo: receipt.receipt_no,
    transactionId: receipt.transaction_id,
    transactionDate: receipt.transaction_date,
    businessName: app.business.trade_name,
    registrationNumber: app.business.registration_number,
    district: app.business.district?.district_name || "Unassigned",
    gatcId: app.assigned_gatc_id,
    applicationType: app.app_type,
    workflowStatus: app.workflow_status,
    instrumentCategory: app.instrument.category.category_name,
    instrumentModel: app.instrument.model_no,
    instrumentSerialNumber: app.instrument.serial_number,
    statutoryFee: Number(receipt.statutory_fee),
    carriageCharges: Number(receipt.carriage_charges),
    adjustingCharges: Number(receipt.adjusting_charges),
    totalAmount: Number(receipt.total_amount),
    govtShare: Number(receipt.govt_share),
    gatcShare: Number(receipt.gatc_share),
    paymentStatus: receipt.payment_status,
    paymentMethod: receipt.payment_method,
  };
};

export const getStateFinancialReport = async (
  stateCode: string,
  filters: StateFinancialReportFilters,
) => {
  const startDate = parseStartDate(filters.startDate);
  const endDate = parseEndDate(filters.endDate);
  const page = Math.max(filters.page ?? 1, 1);
  const limit = Math.min(Math.max(filters.limit ?? 10, 1), 100);

  const repositoryFilters = {
    stateCode,
    startDate,
    endDate,
    search: filters.search,
    district: filters.district,
    gatcId: filters.gatcId,
    applicationType: filters.applicationType,
    workflowStatus: filters.workflowStatus,
    paymentStatus: filters.paymentStatus,
  };

  const [receipts, transactionResult] = await Promise.all([
    findStateFinancialReceipts(repositoryFilters),
    findStateFinancialTransactions(repositoryFilters, page, limit),
  ]);

  const successfulReceipts = receipts.filter(
    (r) => r.payment_status === "SUCCESS",
  );
  const grossRevenue = successfulReceipts.reduce(
    (sum, r) => sum + Number(r.total_amount),
    0,
  );
  const statutoryFees = successfulReceipts.reduce(
    (sum, r) => sum + Number(r.statutory_fee),
    0,
  );
  const carriageCharges = successfulReceipts.reduce(
    (sum, r) => sum + Number(r.carriage_charges),
    0,
  );
  const adjustingCharges = successfulReceipts.reduce(
    (sum, r) => sum + Number(r.adjusting_charges),
    0,
  );
  const stateTreasuryShare = successfulReceipts.reduce(
    (sum, r) => sum + Number(r.govt_share),
    0,
  );
  const gatcShare = successfulReceipts.reduce(
    (sum, r) => sum + Number(r.gatc_share),
    0,
  );

  const monthlyData = new Map<string, any>();

  for (const receipt of successfulReceipts) {
    if (!receipt.transaction_date) continue;
    const key = getMonthKey(receipt.transaction_date);
    if (!monthlyData.has(key)) {
      monthlyData.set(key, {
        month: formatMonth(receipt.transaction_date),
        verificationFees: 0,
        carriageCharges: 0,
        adjustingCharges: 0,
        totalRevenue: 0,
      });
    }
    const month = monthlyData.get(key)!;
    month.verificationFees += Number(receipt.statutory_fee);
    month.carriageCharges += Number(receipt.carriage_charges);
    month.adjustingCharges += Number(receipt.adjusting_charges);
    month.totalRevenue += Number(receipt.total_amount);
  }

  const trends = Array.from(monthlyData.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, value]) => ({
      month: value.month,
      verificationFees: roundMoney(value.verificationFees),
      carriageCharges: roundMoney(value.carriageCharges),
      adjustingCharges: roundMoney(value.adjustingCharges),
      totalRevenue: roundMoney(value.totalRevenue),
    }));

  const governmentPercentage =
    grossRevenue > 0 ? (stateTreasuryShare / grossRevenue) * 100 : 0;
  const gatcPercentage =
    grossRevenue > 0 ? (gatcShare / grossRevenue) * 100 : 0;
  const transactions = transactionResult.transactions.map(mapTransaction);

  return {
    summary: {
      grossRevenue: roundMoney(grossRevenue),
      statutoryFees: roundMoney(statutoryFees),
      carriageCharges: roundMoney(carriageCharges),
      adjustingCharges: roundMoney(adjustingCharges),
      stateTreasuryShare: roundMoney(stateTreasuryShare),
      gatcShare: roundMoney(gatcShare),
      transactionCount: receipts.length,
    },
    trends,
    distribution: {
      governmentPercentage: roundMoney(governmentPercentage),
      gatcPercentage: roundMoney(gatcPercentage),
      governmentAmount: roundMoney(stateTreasuryShare),
      gatcAmount: roundMoney(gatcShare),
    },
    transactions,
    pagination: {
      page,
      limit,
      total: transactionResult.total,
      totalPages: Math.ceil(transactionResult.total / limit),
    },
  };
};

export const getStateFinancialTransactionsForExport = async (
  stateCode: string,
  filters: StateFinancialReportFilters,
) => {
  const receipts = await findStateFinancialReceipts({
    stateCode,
    startDate: parseStartDate(filters.startDate),
    endDate: parseEndDate(filters.endDate),
    search: filters.search,
    district: filters.district,
    gatcId: filters.gatcId,
    applicationType: filters.applicationType,
    workflowStatus: filters.workflowStatus,
    paymentStatus: filters.paymentStatus,
  });
  return receipts.map(mapTransaction);
};

export const generateFinancialCsv = (transactions: FinancialTransaction[]) => {
  const headers = [
    "Date",
    "Receipt No",
    "Transaction ID",
    "Business Name",
    "Registration Number",
    "District",
    "GATC ID",
    "Application Type",
    "Gross Amount",
    "Government Share",
    "GATC Share",
    "Payment Status",
  ];
  const escapeCsv = (val: unknown) =>
    val == null ? '""' : `"${String(val).replace(/"/g, '""')}"`;
  const rows = transactions.map((t) => [
    t.transactionDate || "",
    t.receiptNo,
    t.transactionId || "",
    t.businessName,
    t.registrationNumber,
    t.district || "",
    t.gatcId || "",
    t.applicationType,
    t.totalAmount,
    t.govtShare,
    t.gatcShare,
    t.paymentStatus,
  ]);
  return [
    headers.map(escapeCsv).join(","),
    ...rows.map((r) => r.map(escapeCsv).join(",")),
  ].join("\n");
};
