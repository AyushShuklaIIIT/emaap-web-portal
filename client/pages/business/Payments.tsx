import { Download, IndianRupee } from "lucide-react";
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

const transactions = [
  {
    id: "TXN-99823145",
    date: "20 Aug 2026",
    reference: "APP-2026-7721",
    instrument: "60-Ton Road Weighbridge",
    method: "Corporate Net Banking (HDFC)",
    amount: "₹5,000",
    status: "Success",
  },
  {
    id: "TXN-99781102",
    date: "15 Jul 2026",
    reference: "APP-2026-5509",
    instrument: "Non-Automatic Weighing Scale",
    method: "UPI (PhonePe)",
    amount: "₹500",
    status: "Success",
  },
  {
    id: "TXN-99750011",
    date: "14 Jul 2026",
    reference: "APP-2026-5509",
    instrument: "Non-Automatic Weighing Scale",
    method: "UPI (PhonePe)",
    amount: "₹500",
    status: "Failed",
  },
];

export default function Payments() {
  return (
    <DashboardLayout role="business">
      <section className="mx-auto max-w-[1240px] overflow-hidden rounded-xl border border-[#E0E0E0] bg-white shadow-card">
        <div className="flex flex-col justify-between gap-4 px-7 pb-6 pt-7 sm:flex-row sm:items-center">
          <h1 className="text-2xl font-bold tracking-tight text-[#1A1A2E]">
            Payments &amp; Invoices
          </h1>
          <div className="inline-flex w-fit items-center gap-1.5 rounded-full bg-[#E8F5E9] px-3.5 py-2 text-sm font-semibold text-[#315B3A]">
            <IndianRupee className="h-4 w-4" />
            Total Paid (YTD): ₹4,50,000
          </div>
        </div>

        <div className="border-t border-[#E8E9EC]" />

        <div className="px-7 pb-8 pt-7">
          <h2 className="text-lg font-bold text-[#0B3D91]">Pending Payments</h2>
          <div className="mt-4 flex flex-col gap-5 rounded-lg border border-[#FFE082] bg-[#FFF8E1] p-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <p className="font-bold text-[#1A1A2E]">
                Application ID: APP-2026-8910
              </p>
              <p className="mt-1 text-sm leading-5 text-[#5C5C70]">
                Instrument: CNG Dispenser (2 Nozzles) • Location: Jio-BP Station, BKC
              </p>
            </div>
            <div className="shrink-0 lg:px-8">
              <p className="font-bold text-[#1A1A2E]">Statutory Fee: ₹20,000</p>
              <p className="mt-1 text-sm text-[#5C5C70]">Due Date: 15 Sep 2026</p>
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

          <h2 className="mt-9 text-lg font-bold text-[#0B3D91]">
            Recent Transactions
          </h2>
          <div className="mt-4 overflow-hidden rounded-lg border border-[#E0E0E0]">
            <div className="overflow-x-auto">
              <Table className="min-w-[930px]">
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
                  {transactions.map((transaction) => (
                    <TableRow
                      key={transaction.id}
                      className="border-b border-[#E8E9EC] hover:bg-[#FAFBFC]"
                    >
                      <TableCell className="px-5 py-5 align-top">
                        <p className="font-semibold text-[#1A1A2E]">{transaction.id}</p>
                        <p className="mt-1 text-xs text-[#5C5C70]">{transaction.date}</p>
                      </TableCell>
                      <TableCell className="max-w-[230px] py-5 align-top">
                        <p className="font-semibold text-[#1A1A2E]">{transaction.reference}</p>
                        <p className="mt-1 text-xs leading-5 text-[#5C5C70]">
                          {transaction.instrument}
                        </p>
                      </TableCell>
                      <TableCell className="py-5 align-top text-sm text-[#1A1A2E]">
                        {transaction.method}
                      </TableCell>
                      <TableCell className="py-5 align-top">
                        <p className="font-bold text-[#1A1A2E]">{transaction.amount}</p>
                        <span
                          className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${
                            transaction.status === "Success"
                              ? "bg-[#1E8E3E] text-white"
                              : "bg-[#D32F2F] text-white"
                          }`}
                        >
                          {transaction.status}
                        </span>
                      </TableCell>
                      <TableCell className="pr-5 py-5 align-top">
                        {transaction.status === "Success" ? (
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
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="flex flex-col gap-3 border-t border-[#E8E9EC] px-5 py-3.5 text-sm sm:flex-row sm:items-center sm:justify-between">
              <span className="text-[#5C5C70]">Showing 1 to 3 of 45 transactions</span>
              <div className="flex items-center gap-2">
                <Button variant="ghost" className="h-9 text-sm text-[#5C5C70] hover:text-[#0B3D91]">
                  &lt; Previous
                </Button>
                <Button variant="ghost" className="h-9 font-semibold text-[#0B3D91] hover:bg-primary/5">
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
