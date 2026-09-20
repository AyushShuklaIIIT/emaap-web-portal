import { Download, IndianRupee } from "lucide-react";
import { useMemo } from "react";

import { DashboardLayout } from "@/components/emaap/DashboardLayout";
import { Button } from "@/components/ui/button";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { usePaymentDashboard } from "@/hooks/usePayments";

const formatCurrency = (amount: number) => {
  return amount.toLocaleString("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
};

const formatDate = (date: string | null) => {
  if (!date) {
    return "N/A";
  }

  return new Date(date).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatPaymentMethod = (
  method: "UPI" | "NET_BANKING" | "NEFT_RTGS" | null,
) => {
  switch (method) {
    case "UPI":
      return "UPI";

    case "NET_BANKING":
      return "Net Banking";

    case "NEFT_RTGS":
      return "NEFT / RTGS";

    default:
      return "N/A";
  }
};

const formatPaymentStatus = (status: "PENDING" | "SUCCESS" | "FAILED") => {
  switch (status) {
    case "SUCCESS":
      return "Success";

    case "FAILED":
      return "Failed";

    case "PENDING":
      return "Pending";

    default:
      return status;
  }
};

export default function Payments({ userId }: { userId: string }) {
  const { data, isLoading, isError } = usePaymentDashboard(userId);

  const totalPaidYtd = data?.total_paid_ytd ?? 0;
  const pendingPayments = data?.pending_payments ?? [];
  const transactions = data?.recent_transactions ?? [];
  const displayedTransactions = useMemo(() => transactions, [transactions]);

  if (isLoading) {
    return (
      <DashboardLayout role="business">
        <section className="mx-auto max-w-310 rounded-xl border border-[#E0E0E0] bg-white p-8 shadow-card">
          <p className="text-sm text-[#5C5C70]">Loading payment details...</p>
        </section>
      </DashboardLayout>
    );
  }

  if (isError) {
    return (
      <DashboardLayout role="business">
        <section className="mx-auto max-w-310 rounded-xl border border-[#E0E0E0] bg-white p-8 shadow-card">
          <p className="text-sm text-red-600">
            Failed to load payment details.
          </p>
        </section>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="business">
      <section className="mx-auto max-w-310 overflow-hidden rounded-xl border border-[#E0E0E0] bg-white shadow-card">
        {/* Header */}

        <div className="flex flex-col justify-between gap-4 px-4 pb-6 pt-6 sm:flex-row sm:items-center sm:px-7 sm:pt-7">
          <h1 className="text-xl font-bold tracking-tight text-[#1A1A2E] sm:text-2xl">
            Payments &amp; Invoices
          </h1>

          <div className="inline-flex w-fit items-center gap-1.5 rounded-full bg-[#E8F5E9] px-3.5 py-2 text-sm font-semibold text-[#315B3A]">
            <IndianRupee className="h-4 w-4" />
            Total Paid (YTD): ₹{formatCurrency(totalPaidYtd)}
          </div>
        </div>

        <div className="border-t border-[#E8E9EC]" />

        <div className="px-4 pb-8 pt-7 sm:px-7">
          <h2 className="text-lg font-bold text-[#0B3D91]">Pending Payments</h2>
          {pendingPayments.length === 0 ? (
            <div className="mt-4 rounded-lg border border-[#E0E0E0] p-5">
              <p className="text-sm text-[#5C5C70]">No pending payments.</p>
            </div>
          ) : (
            <div className="mt-4 space-y-4">
              {pendingPayments.map((payment) => (
                <div
                  key={payment.receipt_id}
                  className="flex flex-col gap-5 rounded-lg border border-[#FFE082] bg-[#FFF8E1] p-5 lg:flex-row lg:items-center lg:justify-between"
                >
                  <div className="min-w-0">
                    <p className="font-bold text-[#1A1A2E]">
                      Application ID: {payment.application_id}
                    </p>

                    <p className="mt-1 text-sm leading-5 text-[#5C5C70]">
                      Instrument: {payment.instrument}
                    </p>
                  </div>

                  <div className="shrink-0 lg:px-8">
                    <p className="font-bold text-[#1A1A2E]">
                      Statutory Fee: ₹{formatCurrency(payment.statutory_fee)}
                    </p>

                    <p className="mt-1 text-sm text-[#5C5C70]">
                      Due Date: {formatDate(payment.due_date)}
                    </p>
                  </div>

                  <div className="flex shrink-0 flex-col items-start gap-1.5 lg:items-end">
                    <Button className="h-10 rounded-lg bg-[#FF6F00] px-5 font-bold text-white shadow-none hover:bg-[#E66000]">
                      Pay Now
                    </Button>

                    <span className="text-xs text-[#5C5C70]">
                      Accepts UPI, NEFT/RTGS, Net Banking
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
          <h2 className="mt-9 text-lg font-bold text-[#0B3D91]">
            Recent Transactions
          </h2>
          <div className="mt-4 overflow-hidden rounded-lg border border-[#E0E0E0]">
            <div className="overflow-x-auto">
              <Table className="mobile-card-table min-w-232.5">
                <TableHeader>
                  <TableRow className="border-b border-[#E0E0E0] bg-[#F5F7FA] hover:bg-[#F5F7FA]">
                    <TableHead className="h-12 px-5 text-[11px] font-bold uppercase tracking-wide text-[#5C5C70]">
                      Transaction ID &amp; Date
                    </TableHead>

                    <TableHead className="h-12 text-[11px] font-bold uppercase tracking-wide text-[#5C5C70]">
                      Application / Instrument Ref.
                    </TableHead>

                    <TableHead className="h-12 text-[11px] font-bold uppercase tracking-wide text-[#5C5C70]">
                      Payment Method
                    </TableHead>

                    <TableHead className="h-12 text-[11px] font-bold uppercase tracking-wide text-[#5C5C70]">
                      Amount &amp; Status
                    </TableHead>

                    <TableHead className="h-12 pr-5 text-[11px] font-bold uppercase tracking-wide text-[#5C5C70]">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {displayedTransactions.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className="py-12 text-center text-sm text-[#5C5C70]"
                      >
                        No transactions found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    displayedTransactions.map((transaction) => (
                      <TableRow
                        key={transaction.receipt_id}
                        className="border-b border-[#E8E9EC] hover:bg-[#FAFBFC]"
                      >
                        <TableCell className="px-5 py-5 align-top">
                          <p className="font-semibold text-[#1A1A2E]">
                            {transaction.transaction_id ??
                              transaction.receipt_id}
                          </p>

                          <p className="mt-1 text-xs text-[#5C5C70]">
                            {formatDate(transaction.transaction_date)}
                          </p>
                        </TableCell>

                        {/* Application / Instrument */}

                        <TableCell className="max-w-57.5 py-5 align-top">
                          <p className="font-semibold text-[#1A1A2E]">
                            {transaction.application_id}
                          </p>

                          <p className="mt-1 text-xs leading-5 text-[#5C5C70]">
                            {transaction.instrument}
                          </p>
                        </TableCell>

                        <TableCell className="py-5 align-top text-sm text-[#1A1A2E]">
                          {formatPaymentMethod(transaction.payment_method)}
                        </TableCell>

                        <TableCell className="py-5 align-top">
                          <p className="font-bold text-[#1A1A2E]">
                            ₹{formatCurrency(transaction.total_amount)}
                          </p>

                          <span
                            className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${
                              transaction.payment_status === "SUCCESS"
                                ? "bg-[#1E8E3E] text-white"
                                : transaction.payment_status === "FAILED"
                                  ? "bg-[#D32F2F] text-white"
                                  : "bg-[#F9A825] text-[#1A1A2E]"
                            }`}
                          >
                            {formatPaymentStatus(transaction.payment_status)}
                          </span>
                        </TableCell>

                        <TableCell className="pr-5 py-5 align-top">
                          {transaction.payment_status === "SUCCESS" ? (
                            <Button
                              variant="ghost"
                              className="h-9 gap-1.5 px-2 text-xs font-semibold text-[#0B3D91] hover:bg-primary/5 hover:text-[#0B3D91]"
                            >
                              <Download className="h-4 w-4" />
                              Download Receipt
                            </Button>
                          ) : (
                            <Button
                              variant="ghost"
                              disabled
                              className="h-9 px-2 text-xs font-semibold text-[#9A9AA3]"
                            >
                              Unavailable
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            <div className="flex flex-col gap-3 border-t border-[#E8E9EC] px-5 py-3.5 text-sm sm:flex-row sm:items-center sm:justify-between">
              <span className="text-[#5C5C70]">
                Showing {displayedTransactions.length} transactions
              </span>

              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  disabled
                  className="h-9 text-sm text-[#5C5C70]"
                >
                  &lt; Previous
                </Button>

                <Button
                  variant="ghost"
                  disabled
                  className="h-9 font-semibold text-[#0B3D91]"
                >
                  Next &gt;
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </DashboardLayout>
  );
}
