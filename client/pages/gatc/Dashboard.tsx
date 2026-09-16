import { Link } from "react-router-dom";
import { Download } from "lucide-react";
import { TricolorBar } from "@/components/emaap/TricolorBar";
import { EmaapLogo } from "@/components/emaap/EmaapLogo";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const tasks = [
  {
    app: "APP-8891",
    client: "Indian Oil BKC",
    instrument: "CNG Dispenser",
    mode: "Field (Mobile)",
    technician: "Tech: Rahul Sharma",
    status: "Data & Seal Photos Synced",
    tone: "synced",
    action: "Review & Issue QR Cert",
  },
  {
    app: "APP-8892",
    client: "Adani Gas",
    instrument: "LNG Dispenser",
    mode: "Field (Mobile)",
    technician: "Tech: Amit Patel",
    status: "Awaiting Sync (Offline)",
    tone: "offline",
    action: "Cannot Issue Yet",
  },
  {
    app: "APP-8893",
    client: "Local Mandi",
    instrument: "Standard Weights (Class M1)",
    mode: "In-Lab (Desktop)",
    technician: "Self (Manager)",
    status: "Draft",
    tone: "draft",
    action: "Enter Calibration Data",
  },
];

export default function GatcDashboard() {
  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <TricolorBar />
      <header className="flex h-16 shrink-0 items-center justify-between gap-2 border-b border-border bg-card px-3 sm:px-6">
        <EmaapLogo />
        <Link to="/" className="text-sm font-medium text-primary hover:underline">Sign out</Link>
      </header>
      <main className="min-w-0 flex-1 px-3 py-5 sm:px-6 sm:py-7 lg:px-8">
        <section className="mx-auto max-w-[1320px] overflow-hidden rounded-xl border border-[#E0E0E0] bg-white shadow-card">
          <div className="px-4 pb-6 pt-6 sm:px-7 sm:pt-7">
            <h1 className="text-2xl font-bold tracking-tight text-[#1A1A2E]">GATC Station Command Center</h1>
          </div>
          <div className="border-t border-[#E8E9EC]" />

          <div className="space-y-8 px-4 pb-8 pt-6 sm:px-7 sm:pt-7">
            <div className="flex flex-col gap-4 rounded-lg bg-[#E3F2FD] p-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="min-w-0">
                <p className="font-bold text-[#0B3D91]">Unit ID: GATC-MH-04 (Apex Metrology Labs)</p>
                <p className="mt-1 text-sm leading-5 text-[#0B3D91]/80">Authorized Scope: Energy Dispensers (2026 Rules), High-Capacity Weighbridges, Class-F1 Weights</p>
              </div>
              <span className="inline-flex w-fit shrink-0 items-center gap-1.5 rounded-full bg-[#1E8E3E] px-3 py-1.5 text-xs font-bold text-white">
                <span className="h-1.5 w-1.5 rounded-full bg-white" /> API Sync: Online
              </span>
            </div>

            <section>
              <h2 className="text-lg font-bold text-[#0B3D91]">Live Task Allocation &amp; Field Sync Status</h2>
              <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
                <MetricCard title="Dispatched to Mobile App" value="18" detail="Technicians currently in the field." />
                <MetricCard title="Pending QA & Certification" value="5" detail="Field data synced. Awaiting Manager Approval." tone="amber" />
                <MetricCard title="In-Lab Desktop Verifications" value="12" detail="Instruments brought to the station." />
              </div>
            </section>

            <section>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-[#0B3D91]">Inspection Pipeline &amp; Quality Assurance</h2>
                <span className="rounded-full bg-[#E3F2FD] px-2 py-1 text-[11px] font-semibold text-[#0B3D91]">Manager&apos;s Desk</span>
              </div>
              <div className="mt-4 overflow-hidden rounded-lg border border-[#E0E0E0]">
                <div className="overflow-x-auto">
                  <Table className="mobile-card-table min-w-[1100px]">
                    <TableHeader>
                      <TableRow className="border-b border-[#E0E0E0] bg-[#F5F7FA] hover:bg-[#F5F7FA]">
                        <TableHead className="h-12 px-5 text-[11px] font-bold uppercase tracking-wide text-[#5C5C70]">App ID &amp; Client</TableHead>
                        <TableHead className="h-12 text-[11px] font-bold uppercase tracking-wide text-[#5C5C70]">Instrument</TableHead>
                        <TableHead className="h-12 text-[11px] font-bold uppercase tracking-wide text-[#5C5C70]">Inspection Mode</TableHead>
                        <TableHead className="h-12 text-[11px] font-bold uppercase tracking-wide text-[#5C5C70]">Assigned Technician</TableHead>
                        <TableHead className="h-12 text-[11px] font-bold uppercase tracking-wide text-[#5C5C70]">Status</TableHead>
                        <TableHead className="h-12 pr-5 text-[11px] font-bold uppercase tracking-wide text-[#5C5C70]">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {tasks.map((task) => (
                        <TableRow key={task.app} className="border-b border-[#E8E9EC] hover:bg-[#FAFBFC]">
                          <TableCell className="px-5 py-5 align-top"><p className="font-semibold text-[#1A1A2E]">{task.app}</p><p className="mt-1 text-xs text-[#5C5C70]">{task.client}</p></TableCell>
                          <TableCell className="max-w-[180px] py-5 align-top text-sm leading-5 text-[#1A1A2E]">{task.instrument}</TableCell>
                          <TableCell className="py-5 align-top text-sm text-[#5C5C70]">{task.mode}</TableCell>
                          <TableCell className="py-5 align-top text-sm font-medium text-[#1A1A2E]">{task.technician}</TableCell>
                          <TableCell className="py-5 align-top"><span className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-bold ${task.tone === "synced" ? "bg-[#E3F2FD] text-[#0B3D91]" : task.tone === "offline" ? "bg-[#FFF8E1] text-[#F9A825]" : "bg-[#E0E0E0] text-[#5C5C70]"}`}>{task.status}</span></TableCell>
                          <TableCell className="pr-5 py-5 align-top">
                            {task.tone === "synced" ? <Button className="h-9 whitespace-nowrap rounded-lg bg-[#FF6F00] px-3 text-xs font-bold text-white shadow-none hover:bg-[#E66000]">{task.action}</Button> : <Button variant="ghost" disabled={task.tone === "offline"} className={`h-9 whitespace-nowrap px-2 text-xs font-semibold ${task.tone === "offline" ? "text-[#9A9AA3]" : "text-[#0B3D91] hover:bg-primary/5 hover:text-[#0B3D91]"}`}>{task.action}</Button>}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-bold text-[#0B3D91]">Revenue Settlement - 20% Lab Share</h2>
              <div className="mt-4 flex flex-col gap-4 rounded-lg border border-[#C8E6C9] bg-[#E8F5E9] p-4 lg:flex-row lg:items-center lg:justify-between">
                <div><p className="font-bold text-[#1A1A2E]">Total Verification Fees Processed (YTD): ₹4,50,000</p></div>
                <div><p className="font-bold text-[#1E8E3E]">Your Approved GATC Share (20%): ₹90,000</p><p className="mt-1 text-xs text-[#5C5C70]">Settled by State Treasury</p></div>
                <Button variant="ghost" className="w-fit gap-2 font-semibold text-[#0B3D91] hover:bg-white/70 hover:text-[#0B3D91]"><Download className="h-4 w-4" /> Download Monthly Tax Invoice</Button>
              </div>
            </section>
          </div>
        </section>
      </main>
    </div>
  );
}

function MetricCard({ title, value, detail, tone = "blue" }: { title: string; value: string; detail: string; tone?: "blue" | "amber" }) {
  return <div className="rounded-lg border border-[#E0E0E0] bg-white p-4 shadow-card"><p className="text-sm font-medium text-[#5C5C70]">{title}</p><p className={`mt-3 text-3xl font-extrabold tracking-tight ${tone === "amber" ? "text-[#F9A825]" : "text-[#0B3D91]"}`}>{value}</p><p className="mt-2 min-h-10 text-xs leading-5 text-[#5C5C70]">{detail}</p></div>;
}
