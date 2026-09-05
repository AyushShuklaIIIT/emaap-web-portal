import { useMemo, useState } from "react";
import { Download, Search } from "lucide-react";
import { DashboardLayout } from "@/components/emaap/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
    date: "05 Sep 2026",
    id: "TXN-8991223",
    entity: "Indian Oil Corporation Ltd. (IOCL)",
    instrument: "CNG Dispenser - 4 Nozzles (₹10,000/nozzle)",
    amount: "₹40,000",
    status: "Settled (Govt: ₹32k | GATC: ₹8k)",
    tone: "success",
  },
  {
    date: "04 Sep 2026",
    id: "TXN-8991190",
    entity: "Tata Steel BSL",
    instrument: "100-Ton Rail Weighbridge",
    amount: "₹15,000",
    status: "GATC Payout Pending",
    tone: "warning",
  },
  {
    date: "02 Sep 2026",
    id: "TXN-8990451",
    entity: "Local Retail Market Association",
    instrument: "Compounding Fine - Tampered Lead Seal",
    amount: "₹25,000",
    status: "100% State Treasury",
    tone: "blue",
  },
];

const chartData = [
  { label: "April", verification: 22, fines: 5 },
  { label: "May", verification: 27, fines: 6 },
  { label: "June", verification: 24, fines: 8 },
  { label: "July", verification: 31, fines: 7 },
  { label: "August", verification: 35, fines: 10 },
];

export default function Revenue() {
  const [query, setQuery] = useState("");
  const filteredTransactions = useMemo(() => {
    const normalizedQuery = query.toLowerCase().trim();
    if (!normalizedQuery) return transactions;
    return transactions.filter((transaction) =>
      `${transaction.id} ${transaction.entity} ${transaction.instrument}`
        .toLowerCase()
        .includes(normalizedQuery),
    );
  }, [query]);

  return (
    <DashboardLayout role="admin">
      <section className="mx-auto max-w-[1320px] rounded-xl border border-[#E0E0E0] bg-white p-6 shadow-card sm:p-7">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <h1 className="text-2xl font-bold tracking-tight text-[#1A1A2E]">
            Financial Reports &amp; Settlements
          </h1>
          <div className="flex flex-wrap items-center gap-2">
            <button className="h-10 rounded-lg border border-[#E0E0E0] bg-white px-3 text-sm text-[#1A1A2E] hover:border-primary">
              01 Apr 2026 - 05 Sep 2026
            </button>
            <select className="h-10 rounded-lg border border-[#E0E0E0] bg-white px-3 text-sm text-[#1A1A2E] outline-none hover:border-primary focus:border-primary">
              <option>Revenue Type: All (Verification + Penalties)</option>
              <option>Revenue Type: Verification Fees</option>
              <option>Revenue Type: Compounding Penalties</option>
            </select>
            <Button className="h-10 rounded-lg bg-[#FF6F00] font-bold text-white shadow-none hover:bg-[#E66000]">
              <Download className="mr-1.5 h-4 w-4" /> Export Financial CSV
            </Button>
          </div>
        </div>

        <div className="mt-6 border-t border-[#E8E9EC] pt-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Kpi title="Gross Revenue (YTD)" value="₹145.2 Cr" detail="+8.4% vs Last Year" tone="blue" positive />
            <Kpi title="State Treasury Share (80%)" value="₹116.1 Cr" detail="Transferred to Consolidated Fund" tone="green" />
            <Kpi title="Pending GATC Payouts (20%)" value="₹12.4 Cr" detail="Awaiting month-end settlement" tone="amber" />
            <Kpi title="Compounding & Penalties" value="₹8.5 Cr" detail="Fines collected for tampering/expiry" tone="dark" />
          </div>
        </div>

        <section className="mt-8">
          <h2 className="text-lg font-bold text-[#0B3D91]">Revenue Collection Trends</h2>
          <div className="mt-4 grid grid-cols-1 gap-5 rounded-lg border border-[#E0E0E0] p-5 xl:grid-cols-[1fr_270px]">
            <div className="min-w-0">
              <div className="mb-3 flex flex-wrap gap-4 text-xs text-[#5C5C70]">
                <span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-sm bg-[#0B3D91]" /> Verification Fees</span>
                <span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-sm bg-[#FF6F00]" /> Compounding Fines</span>
              </div>
              <div className="h-[250px] w-full">
                <svg viewBox="0 0 620 230" className="h-full w-full" role="img" aria-label="Stacked monthly revenue chart">
                  {[35, 80, 125, 170].map((y) => <line key={y} x1="55" y1={y} x2="600" y2={y} stroke="#E8E9EC" strokeWidth="1" />)}
                  <text x="4" y="39" fill="#8A8A98" fontSize="10">₹40 Cr</text>
                  <text x="4" y="84" fill="#8A8A98" fontSize="10">₹30 Cr</text>
                  <text x="4" y="129" fill="#8A8A98" fontSize="10">₹20 Cr</text>
                  <text x="4" y="174" fill="#8A8A98" fontSize="10">₹10 Cr</text>
                  {chartData.map((month, index) => {
                    const x = 83 + index * 105;
                    const verificationHeight = month.verification * 3.8;
                    const finesHeight = month.fines * 3.8;
                    const base = 190;
                    return (
                      <g key={month.label}>
                        <rect x={x} y={base - verificationHeight} width="42" height={verificationHeight} rx="3" fill="#0B3D91" />
                        <rect x={x} y={base - verificationHeight - finesHeight} width="42" height={finesHeight} rx="3" fill="#FF6F00" />
                        <text x={x + 21} y="214" textAnchor="middle" fill="#5C5C70" fontSize="10">{month.label}</text>
                      </g>
                    );
                  })}
                  <line x1="55" y1="190" x2="600" y2="190" stroke="#BFC4CC" strokeWidth="1" />
                </svg>
              </div>
            </div>
            <div className="flex flex-col items-center justify-center border-t border-[#E8E9EC] pt-5 xl:border-l xl:border-t-0 xl:pl-5 xl:pt-0">
              <p className="text-sm font-bold text-[#0B3D91]">Revenue Distribution</p>
              <div className="relative mt-4 h-36 w-36 rounded-full" style={{ background: "conic-gradient(#0B3D91 0deg 288deg, #FF6F00 288deg 360deg)" }}>
                <div className="absolute inset-6 flex items-center justify-center rounded-full bg-white text-center">
                  <span className="text-lg font-extrabold text-[#1A1A2E]">80:20</span>
                </div>
              </div>
              <div className="mt-4 flex gap-4 text-xs text-[#5C5C70]">
                <span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-[#0B3D91]" /> Govt 80%</span>
                <span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-[#FF6F00]" /> GATC 20%</span>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-8">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <h2 className="text-lg font-bold text-[#0B3D91]">Recent Statutory Fee Transactions</h2>
            <div className="relative sm:w-[300px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8A8A98]" />
              <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by TXN ID or Business Name..." className="h-10 rounded-lg border-[#E0E0E0] pl-9 text-sm shadow-none hover:border-primary focus-visible:border-primary focus-visible:ring-primary/15" />
            </div>
          </div>
          <div className="mt-4 overflow-hidden rounded-lg border border-[#E0E0E0]">
            <div className="overflow-x-auto">
              <Table className="min-w-[1050px]">
                <TableHeader>
                  <TableRow className="border-b border-[#E0E0E0] bg-[#F5F7FA] hover:bg-[#F5F7FA]">
                    <TableHead className="h-12 px-5 text-[11px] font-bold uppercase tracking-wide text-[#5C5C70]">Date &amp; TXN ID</TableHead>
                    <TableHead className="h-12 text-[11px] font-bold uppercase tracking-wide text-[#5C5C70]">Corporate Entity</TableHead>
                    <TableHead className="h-12 text-[11px] font-bold uppercase tracking-wide text-[#5C5C70]">Instrument &amp; Fee Category (2026 Rules)</TableHead>
                    <TableHead className="h-12 text-[11px] font-bold uppercase tracking-wide text-[#5C5C70]">Gross Amount</TableHead>
                    <TableHead className="h-12 pr-5 text-[11px] font-bold uppercase tracking-wide text-[#5C5C70]">Settlement Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTransactions.map((transaction) => (
                    <TableRow key={transaction.id} className="border-b border-[#E8E9EC] hover:bg-[#FAFBFC]">
                      <TableCell className="px-5 py-5 align-top"><p className="font-semibold text-[#1A1A2E]">{transaction.date}</p><p className="mt-1 text-xs text-[#5C5C70]">{transaction.id}</p></TableCell>
                      <TableCell className="py-5 align-top text-sm font-semibold text-[#1A1A2E]">{transaction.entity}</TableCell>
                      <TableCell className="max-w-[300px] py-5 align-top text-sm leading-5 text-[#1A1A2E]">{transaction.instrument}</TableCell>
                      <TableCell className={`py-5 align-top font-bold ${transaction.tone === "blue" ? "text-[#D32F2F]" : "text-[#1A1A2E]"}`}>{transaction.amount}</TableCell>
                      <TableCell className="pr-5 py-5 align-top"><span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${transaction.tone === "success" ? "bg-[#1E8E3E] text-white" : transaction.tone === "warning" ? "bg-[#F9A825] text-[#1A1A2E]" : "bg-[#0B3D91] text-white"}`}>{transaction.status}</span></TableCell>
                    </TableRow>
                  ))}
                  {filteredTransactions.length === 0 && <TableRow><TableCell colSpan={5} className="py-12 text-center text-sm text-[#5C5C70]">No transactions match your search.</TableCell></TableRow>}
                </TableBody>
              </Table>
            </div>
          </div>
        </section>
      </section>
    </DashboardLayout>
  );
}

function Kpi({ title, value, detail, tone, positive = false }: { title: string; value: string; detail: string; tone: "blue" | "green" | "amber" | "dark"; positive?: boolean }) {
  const valueClass = tone === "blue" ? "text-[#0B3D91]" : tone === "green" ? "text-[#1E8E3E]" : tone === "amber" ? "text-[#F9A825]" : "text-[#1A1A2E]";
  return <div className="rounded-lg border border-[#E0E0E0] bg-white p-4 shadow-card"><p className="text-sm font-medium text-[#5C5C70]">{title}</p><p className={`mt-3 text-2xl font-extrabold tracking-tight ${valueClass}`}>{value}</p><p className={`mt-2 text-xs leading-5 ${positive ? "font-bold text-[#1E8E3E]" : "text-[#5C5C70]"}`}>{detail}</p></div>;
}
