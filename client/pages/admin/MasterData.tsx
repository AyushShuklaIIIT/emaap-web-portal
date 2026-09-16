import { useMemo, useState } from "react";
import { Clock, Search } from "lucide-react";
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

const feeSchedules = [
  {
    code: "CAT-2026-ENG",
    category: "Energy/Fuel Dispensers",
    specification: "CNG, LNG, LPG & Hydrogen Dispensers",
    fee: "₹10,000 per nozzle",
    split: "80:20 (State/GATC)",
    status: "Active",
    statusNote: "Since 01-Jan-2026",
    tone: "active",
  },
  {
    code: "CAT-2011-FL",
    category: "Liquid Fuel Dispensers",
    specification: "Petrol & Diesel Dispensers (Retail)",
    fee: "₹5,000 per nozzle",
    split: "80:20 (State/GATC)",
    status: "Active",
    statusNote: "",
    tone: "active",
  },
  {
    code: "CAT-2011-WB",
    category: "Weighbridges",
    specification: "Road & Rail (Capacity > 50 Tonnes)",
    fee: "₹15,000 per unit",
    split: "Standard (Varies by State)",
    status: "Active",
    statusNote: "",
    tone: "active",
  },
  {
    code: "CAT-1985-OLD",
    category: "Mechanical Scales",
    specification: "Traditional Beam Scales (Class C)",
    fee: "₹100 per unit",
    split: "100% State Treasury",
    status: "Deprecated",
    statusNote: "",
    tone: "deprecated",
  },
];

const tabs = [
  "Statutory Fee Schedules (5th Schedule)",
  "Instrument Categories (23 GATC Types)",
  "State & UT Jurisdiction Codes",
  "Metrological Tolerance Limits",
];

export default function MasterData() {
  const [query, setQuery] = useState("");
  const filteredSchedules = useMemo(() => {
    const normalizedQuery = query.toLowerCase().trim();
    if (!normalizedQuery) return feeSchedules;
    return feeSchedules.filter((schedule) =>
      `${schedule.code} ${schedule.category} ${schedule.specification}`
        .toLowerCase()
        .includes(normalizedQuery),
    );
  }, [query]);

  return (
    <DashboardLayout role="admin">
      <section className="mx-auto max-w-[1340px] overflow-hidden rounded-xl border border-[#E0E0E0] bg-white shadow-card">
        <div className="px-4 pb-0 pt-6 sm:px-7 sm:pt-7">
          <h1 className="text-xl font-bold tracking-tight text-[#1A1A2E] sm:text-2xl">
            System Configuration &amp; Master Data
          </h1>
          <div className="mt-6 flex gap-6 overflow-x-auto border-b border-[#E8E9EC]">
            {tabs.map((tab, index) => (
              <button
                key={tab}
                type="button"
                className={`-mb-px whitespace-nowrap border-b-2 px-1 pb-3 text-sm ${
                  index === 0
                    ? "border-[#0B3D91] font-bold text-[#0B3D91]"
                    : "border-transparent font-medium text-[#5C5C70] hover:border-[#CBD5E1] hover:text-[#0B3D91]"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        <div className="px-4 pb-7 pt-7 sm:px-7">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <h2 className="text-lg font-bold text-[#0B3D91]">
              Central Notified Verification Fees
            </h2>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <div className="relative sm:w-[270px]">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8A8A98]" />
                <Input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search by Category or Code..."
                  className="h-10 rounded-lg border-[#E0E0E0] pl-9 text-sm shadow-none hover:border-primary focus-visible:border-primary focus-visible:ring-primary/15"
                />
              </div>
              <Button className="h-10 w-fit rounded-lg bg-[#FF6F00] px-4 font-bold text-white shadow-none hover:bg-[#E66000]">
                + Add New Fee Bracket
              </Button>
            </div>
          </div>

          <div className="mt-4 overflow-hidden rounded-lg border border-[#E0E0E0]">
            <div className="overflow-x-auto">
              <Table className="mobile-card-table min-w-[1120px]">
                <TableHeader>
                  <TableRow className="border-b border-[#E0E0E0] bg-[#F5F7FA] hover:bg-[#F5F7FA]">
                    <TableHead className="h-12 px-5 text-[11px] font-bold uppercase tracking-wide text-[#5C5C70]">Ref Code &amp; Instrument Category</TableHead>
                    <TableHead className="h-12 text-[11px] font-bold uppercase tracking-wide text-[#5C5C70]">Technical Specification</TableHead>
                    <TableHead className="h-12 text-[11px] font-bold uppercase tracking-wide text-[#5C5C70]">Prescribed Verification Fee (Govt Cap)</TableHead>
                    <TableHead className="h-12 text-[11px] font-bold uppercase tracking-wide text-[#5C5C70]">Revenue Split Rule</TableHead>
                    <TableHead className="h-12 text-[11px] font-bold uppercase tracking-wide text-[#5C5C70]">Status</TableHead>
                    <TableHead className="h-12 pr-5 text-[11px] font-bold uppercase tracking-wide text-[#5C5C70]">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSchedules.map((schedule) => (
                    <TableRow key={schedule.code} className="border-b border-[#E8E9EC] hover:bg-[#FAFBFC]">
                      <TableCell className="px-5 py-5 align-top">
                        <p className="font-semibold text-[#1A1A2E]">{schedule.code}</p>
                        <p className="mt-1 text-sm font-bold text-[#0B3D91]">{schedule.category}</p>
                      </TableCell>
                      <TableCell className="max-w-[230px] py-5 align-top text-sm leading-5 text-[#1A1A2E]">{schedule.specification}</TableCell>
                      <TableCell className="py-5 align-top font-bold text-[#1A1A2E]">{schedule.fee}</TableCell>
                      <TableCell className="py-5 align-top text-sm text-[#1A1A2E]">{schedule.split}</TableCell>
                      <TableCell className="py-5 align-top">
                        <span className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-bold ${schedule.tone === "active" ? "bg-[#1E8E3E] text-white" : "bg-[#E0E0E0] text-[#1A1A2E]"}`}>
                          {schedule.status}
                        </span>
                        {schedule.statusNote && <p className="mt-2 whitespace-nowrap text-xs text-[#5C5C70]">{schedule.statusNote}</p>}
                      </TableCell>
                      <TableCell className="pr-5 py-5 align-top">
                        <Button
                          variant="ghost"
                          disabled={schedule.tone === "deprecated"}
                          className={`h-9 whitespace-nowrap px-2 text-xs font-semibold ${schedule.tone === "deprecated" ? "text-[#9A9AA3]" : "text-[#0B3D91] hover:bg-primary/5 hover:text-[#0B3D91]"}`}
                        >
                          {schedule.tone === "deprecated" ? "Locked" : "Edit/View"}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredSchedules.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="py-12 text-center text-sm text-[#5C5C70]">No fee schedules match your search.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
            <div className="flex flex-col gap-3 border-t border-[#E8E9EC] px-5 py-4 text-sm sm:flex-row sm:items-center sm:justify-between">
              <span className="text-[#5C5C70]">Showing 1 to 4 of 128 registered fee schedules.</span>
              <span className="flex items-center gap-1.5 text-xs italic text-[#5C5C70]"><Clock className="h-3.5 w-3.5" /> Last system-wide update: 01 April 2026 by SuperAdmin</span>
            </div>
          </div>
        </div>
      </section>
    </DashboardLayout>
  );
}
