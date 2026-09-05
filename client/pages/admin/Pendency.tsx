import { AlertTriangle, LoaderCircle } from "lucide-react";
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

const queue = [
  {
    id: "APP-2026-9901",
    date: "20 Aug 2026",
    entity: "Adani Total Gas Ltd.",
    location: "Noida, UP",
    instrument: "CNG Dispenser (Multi-Nozzle)",
    sla: "16 Days Pending",
    slaNote: "SLA Breached",
    slaTone: "critical",
    suggestion: "Re-routing to GATC-UP-08. Distance: 2.4 km. Status: Certified for Energy/Fuel.",
    suggestionTone: "highlight",
    action: "Approve Route",
  },
  {
    id: "APP-2026-9955",
    date: "01 Sep 2026",
    entity: "JK Cements",
    location: "Kanpur, UP",
    instrument: "100-Ton Road Weighbridge",
    sla: "4 Days Pending",
    slaNote: "",
    slaTone: "warning",
    suggestion: "Assigned to LMO-UP-14. Distance: 12.1 km. Workload: Medium.",
    suggestionTone: "plain",
    action: "Manual Override",
  },
  {
    id: "APP-2026-9980",
    date: "05 Sep 2026",
    entity: "D-Mart Supermarket",
    location: "Lucknow, UP",
    instrument: "Non-Automatic Weighing Scale",
    sla: "1 Day Pending",
    slaNote: "",
    slaTone: "success",
    suggestion: "Calculating nearest available LMO...",
    suggestionTone: "loading",
    action: "Wait",
  },
] as const;

export default function Pendency() {
  return (
    <DashboardLayout role="admin">
      <section className="mx-auto max-w-[1320px] overflow-hidden rounded-xl border border-[#E0E0E0] bg-white shadow-card">
        <div className="flex flex-col justify-between gap-4 px-7 pb-6 pt-7 sm:flex-row sm:items-center">
          <h1 className="text-2xl font-bold tracking-tight text-[#1A1A2E]">
            Pendency Queue &amp; Workflow Engine
          </h1>
          <div className="flex flex-col gap-2 sm:flex-row">
            <select className="h-10 rounded-lg border border-[#E0E0E0] bg-white px-3 text-sm text-[#1A1A2E] outline-none hover:border-primary focus:border-primary">
              <option>State/Zone: Uttar Pradesh (High Volume)</option>
              <option>State/Zone: Maharashtra</option>
              <option>State/Zone: All India</option>
            </select>
            <select className="h-10 rounded-lg border border-[#E0E0E0] bg-white px-3 text-sm text-[#1A1A2E] outline-none hover:border-primary focus:border-primary">
              <option>SLA Status: Breached (&gt;15 Days)</option>
              <option>SLA Status: Within SLA</option>
              <option>SLA Status: All</option>
            </select>
          </div>
        </div>

        <div className="mx-7 flex items-start gap-3 rounded-lg border border-[#FFCDD2] bg-[#FFEBEE] px-4 py-3.5 text-sm text-[#9B1C1C]">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-[#D32F2F]" />
          <p className="font-bold">
            System Alert: 142 applications in the UP Zone have breached the 15-day SLA. Algorithmic re-routing to private GATCs is recommended.
          </p>
        </div>

        <div className="mx-7 mt-6 border-t border-[#E8E9EC]" />

        <div className="px-7 pb-7 pt-6">
          <div className="overflow-hidden rounded-lg border border-[#E0E0E0]">
            <div className="overflow-x-auto">
              <Table className="min-w-[1220px]">
                <TableHeader>
                  <TableRow className="border-b border-[#E0E0E0] bg-[#F5F7FA] hover:bg-[#F5F7FA]">
                    <TableHead className="h-12 px-5 text-[11px] font-bold uppercase tracking-wide text-[#5C5C70]">App ID &amp; Date</TableHead>
                    <TableHead className="h-12 text-[11px] font-bold uppercase tracking-wide text-[#5C5C70]">Business Entity &amp; Location</TableHead>
                    <TableHead className="h-12 text-[11px] font-bold uppercase tracking-wide text-[#5C5C70]">Instrument Profile</TableHead>
                    <TableHead className="h-12 text-[11px] font-bold uppercase tracking-wide text-[#5C5C70]">SLA Status</TableHead>
                    <TableHead className="h-12 min-w-[350px] text-[11px] font-bold uppercase tracking-wide text-[#5C5C70]">AI Algorithmic Suggestion</TableHead>
                    <TableHead className="h-12 pr-5 text-[11px] font-bold uppercase tracking-wide text-[#5C5C70]">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {queue.map((item) => (
                    <TableRow key={item.id} className="border-b border-[#E8E9EC] hover:bg-[#FAFBFC]">
                      <TableCell className="px-5 py-5 align-top">
                        <p className="font-semibold text-[#1A1A2E]">{item.id}</p>
                        <p className="mt-1 text-xs text-[#5C5C70]">{item.date}</p>
                      </TableCell>
                      <TableCell className="py-5 align-top">
                        <p className="font-semibold text-[#1A1A2E]">{item.entity}</p>
                        <p className="mt-1 text-xs text-[#5C5C70]">{item.location}</p>
                      </TableCell>
                      <TableCell className="max-w-[190px] py-5 align-top text-sm leading-5 text-[#1A1A2E]">
                        {item.instrument}
                      </TableCell>
                      <TableCell className="py-5 align-top">
                        <span className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-bold ${
                          item.slaTone === "critical"
                            ? "bg-[#D32F2F] text-white"
                            : item.slaTone === "warning"
                              ? "bg-[#F9A825] text-[#1A1A2E]"
                              : "bg-[#1E8E3E] text-white"
                        }`}>
                          {item.sla}
                        </span>
                        {item.slaNote && <p className="mt-2 text-xs font-medium text-[#D32F2F]">{item.slaNote}</p>}
                      </TableCell>
                      <TableCell className="py-5 align-top">
                        {item.suggestionTone === "highlight" ? (
                          <div className="rounded-md bg-[#E3F2FD] px-3 py-2.5 text-xs font-medium leading-5 text-[#0B3D91]">
                            {item.suggestion}
                          </div>
                        ) : item.suggestionTone === "loading" ? (
                          <div className="flex items-center gap-2 text-sm italic text-[#8A8A98]">
                            <LoaderCircle className="h-4 w-4 animate-spin" /> {item.suggestion}
                          </div>
                        ) : (
                          <p className="text-sm leading-5 text-[#1A1A2E]">{item.suggestion}</p>
                        )}
                      </TableCell>
                      <TableCell className="pr-5 py-5 align-top">
                        {item.action === "Approve Route" ? (
                          <Button className="h-9 whitespace-nowrap rounded-lg bg-[#FF6F00] px-3 text-xs font-bold text-white shadow-none hover:bg-[#E66000]">
                            {item.action}
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            disabled={item.action === "Wait"}
                            className={`h-9 whitespace-nowrap px-2 text-xs font-semibold ${
                              item.action === "Wait"
                                ? "text-[#9A9AA3]"
                                : "text-[#0B3D91] hover:bg-primary/5 hover:text-[#0B3D91]"
                            }`}
                          >
                            {item.action}
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="flex flex-col gap-3 border-t border-[#E8E9EC] px-5 py-4 text-sm sm:flex-row sm:items-center sm:justify-between">
              <Button variant="ghost" className="w-fit font-semibold text-[#0B3D91] hover:bg-primary/5 hover:text-[#0B3D91]">
                Bulk Approve Selected Routes
              </Button>
              <div className="flex flex-wrap items-center gap-2 text-[#5C5C70]">
                <span>Showing 1 to 3 of 142 critical applications</span>
                <Button variant="ghost" className="h-9 text-sm text-[#5C5C70] hover:text-[#0B3D91]">&lt; Previous</Button>
                <Button variant="ghost" className="h-9 font-semibold text-[#0B3D91] hover:bg-primary/5">Next &gt;</Button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </DashboardLayout>
  );
}
