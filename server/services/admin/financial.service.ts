import {
  findFinancialReceipts,
  findFinancialTransactions,
} from "../../repositories/financial.repository";
import { FinancialTransaction, FinancialReportFilters } from "../../types";

const roundMoney = (value: number): number => {
  return Math.round((value + Number.EPSILON) * 100) / 100;
};

const parseStartDate = (date?: string): Date | undefined => {
  if (!date) {
    return undefined;
  }

  const parsed = new Date(`${date}T00:00:00.000Z`);

  if (Number.isNaN(parsed.getTime())) {
    throw new Error("Invalid start date");
  }

  return parsed;
};

const parseEndDate = (date?: string): Date | undefined => {
  if (!date) {
    return undefined;
  }

  const parsed = new Date(`${date}T23:59:59.999Z`);

  if (Number.isNaN(parsed.getTime())) {
    throw new Error("Invalid end date");
  }

  return parsed;
};

const validateDateRange = (startDate?: Date, endDate?: Date) => {
  if (startDate && endDate && startDate > endDate) {
    throw new Error("Start date cannot be after end date");
  }
};

const getMonthKey = (date: Date) => {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");

  return `${year}-${month}`;
};

const formatMonth = (date: Date) => {
  return date.toLocaleString("en-IN", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
};

const mapTransaction = (receipt: any): FinancialTransaction => {
  const application = receipt.application;
  const business = application.business;
  const instrument = application.instrument;

  return {
    receiptId: receipt.receipt_id,
    receiptNo: receipt.receipt_no,
    transactionId: receipt.transaction_id,
    transactionDate: receipt.transaction_date,
    businessName: business.trade_name,
    registrationNumber: business.registration_number,
    applicationType: application.app_type,
    workflowStatus: application.workflow_status,
    instrumentCategory: instrument.category.category_name,
    instrumentModel: instrument.model_no,
    instrumentSerialNumber: instrument.serial_number,
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

export const getFinancialReport = async (filters: FinancialReportFilters) => {
  const startDate = parseStartDate(filters.startDate);
  const endDate = parseEndDate(filters.endDate);

  validateDateRange(startDate, endDate);

  const page = Math.max(filters.page ?? 1, 1);
  const limit = Math.min(Math.max(filters.limit ?? 10, 1), 100);

  const repositoryFilters = {
    startDate,
    endDate,
    search: filters.search,
    applicationType: filters.applicationType,
    workflowStatus: filters.workflowStatus,
    paymentStatus: filters.paymentStatus,
  };

  const [receipts, transactionResult] = await Promise.all([
    findFinancialReceipts(repositoryFilters),

    findFinancialTransactions(repositoryFilters, page, limit),
  ]);

  const successfulReceipts = receipts.filter(
    (receipt) => receipt.payment_status === "SUCCESS"
  );

  const grossRevenue = successfulReceipts.reduce(
    (sum, receipt) => sum + Number(receipt.total_amount),
    0,
  );

  const statutoryFees = successfulReceipts.reduce(
    (sum, receipt) => sum + Number(receipt.statutory_fee),
    0,
  );

  const carriageCharges = successfulReceipts.reduce(
    (sum, receipt) => sum + Number(receipt.carriage_charges),
    0,
  );

  const adjustingCharges = successfulReceipts.reduce(
    (sum, receipt) => sum + Number(receipt.adjusting_charges),
    0,
  );

  const stateTreasuryShare = successfulReceipts.reduce(
    (sum, receipt) => sum + Number(receipt.govt_share),
    0,
  );

  const gatcShare = successfulReceipts.reduce(
    (sum, receipt) => sum + Number(receipt.gatc_share),
    0,
  );

  const monthlyData = new Map<
    string,
    {
      month: string;
      verificationFees: number;
      carriageCharges: number;
      adjustingCharges: number;
      totalRevenue: number;
    }
  >();

  for (const receipt of successfulReceipts) {
    if (!receipt.transaction_date) {
      continue;
    }

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

export const getFinancialTransactionsForExport = async (
  filters: FinancialReportFilters,
) => {
  const startDate = parseStartDate(filters.startDate);
  const endDate = parseEndDate(filters.endDate);
  validateDateRange(startDate, endDate);

  const receipts = await findFinancialReceipts({
    startDate,
    endDate,

    search: filters.search,
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

    "Application Type",
    "Workflow Status",

    "Instrument Category",
    "Instrument Model",
    "Instrument Serial Number",

    "Statutory Fee",
    "Carriage Charges",
    "Adjusting Charges",
    "Gross Amount",

    "Government Share",
    "GATC Share",

    "Payment Status",
    "Payment Method",
  ];

  const escapeCsv = (value: unknown): string => {
    if (value === null || value === undefined) {
      return '""';
    }

    return `"${String(value).replace(/"/g, '""')}"`;
  };

  const rows = transactions.map((transaction) => [
    transaction.transactionDate
      ? transaction.transactionDate.toISOString()
      : "",

    transaction.receiptNo,
    transaction.transactionId ?? "",
    transaction.businessName,
    transaction.registrationNumber,
    transaction.applicationType,
    transaction.workflowStatus,
    transaction.instrumentCategory,
    transaction.instrumentModel,
    transaction.instrumentSerialNumber,
    transaction.statutoryFee,
    transaction.carriageCharges,
    transaction.adjustingCharges,
    transaction.totalAmount,
    transaction.govtShare,
    transaction.gatcShare,
    transaction.paymentStatus,
    transaction.paymentMethod ?? "",
  ]);

  return [
    headers.map(escapeCsv).join(","),

    ...rows.map((row) => row.map(escapeCsv).join(",")),
  ].join("\n");
};
