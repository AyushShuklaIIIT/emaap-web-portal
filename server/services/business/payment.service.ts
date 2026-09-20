import { AppError } from "../../errors/AppError";
import {
  findUserByUserId,
  findBusinessByUserId,
} from "../../repositories/dashboard.repository";
import {
  getPaymentReceiptsByBusinessId,
  getPaymentReceiptById,
} from "../../repositories/payment.repository";
import { PaymentDashboardData } from "../../types";

export const getPaymentDashboardService = async (
  userId: string,
): Promise<PaymentDashboardData> => {
  const user = await findUserByUserId(userId);
  if (!user) {
    throw new AppError(404, "User not found");
  }

  const business = await findBusinessByUserId(userId);
  if (!business) {
    return [];
  }

  const receipts = await getPaymentReceiptsByBusinessId(business.business_id);

  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const endOfYear = new Date(now.getFullYear() + 1, 0, 1);

  const successfulPayments = receipts.filter(
    (receipt) =>
      receipt.payment_status === "SUCCESS" &&
      receipt.transaction_date &&
      receipt.transaction_date >= startOfYear &&
      receipt.transaction_date < endOfYear,
  );

  const totalPaidYtd = successfulPayments.reduce(
    (sum, receipt) => sum + receipt.total_amount,
    0,
  );

  const pendingPayments = receipts
    .filter((receipt) => receipt.payment_status === "PENDING")
    .map((receipt) => ({
      receipt_id: receipt.receipt_id,
      receipt_no: receipt.receipt_no,
      application_id: receipt.application.application_no,
      instrument: receipt.application.instrument.category.category_name,
      due_date: receipt.due_date,
      statutory_fee: receipt.statutory_fee,
      total_amount: receipt.total_amount,
    }));

  const recentTransactions = receipts
    .filter(
      (receipt) =>
        receipt.payment_status === "SUCCESS" ||
        receipt.payment_status === "FAILED",
    )
    .map((receipt) => ({
      receipt_id: receipt.receipt_id,
      transaction_id: receipt.transaction_id,
      transaction_date: receipt.transaction_date,
      application_id: receipt.application.application_no,
      instrument: receipt.application.instrument.category.category_name,
      payment_method: receipt.payment_method,
      total_amount: receipt.total_amount,
      payment_status: receipt.payment_status,
    }))
    .slice(0, 10);

  return {
    total_paid_ytd: totalPaidYtd,
    pending_payments: pendingPayments,
    recent_transactions: recentTransactions,
  };
};

export const getPaymentReceiptService = async (
  userId: string,
  receiptId: string,
) => {
  const user = await findUserByUserId(userId);
  if (!user) {
    throw new AppError(404, "User not found");
  }

  const business = await findBusinessByUserId(userId);
  if (!business) {
    throw new AppError(404, "Business not found");
  }

  const receipt = await getPaymentReceiptById(business.business_id, receiptId);
  if (!receipt) {
    throw new AppError(404, "Payment receipt not found");
  }

  return receipt;
};
