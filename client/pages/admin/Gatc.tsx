import { useMemo, useState } from "react";
import { Search } from "lucide-react";
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

const centres = [
  {
    id: "GATC-MH-04",
    name: "Apex Metrology Labs",
    categories: "Energy Dispensing (CNG, LNG, Hydrogen) & High-Capacity Weighbridges",
    validity: "Valid",
    validityNote: "Expires: 12 Dec 2026",
    total: "Total: ₹45,00,000",
    split: "(Govt: ₹36L | GATC: ₹9L)",
    tone: "valid",
    action: "View Profile",
  },
  {
    id: "GATC-UP-08",
    name: "Precision Testing Centre",
    categories: "Clinical Thermometers, Water Meters, Beam Scales",
    validity: "Expiring Soon",
    validityNote: "Expires: 18 Sep 2026",
    total: "Total: ₹10,00,000",
    split: "(Govt: ₹8L | GATC: ₹2L)",
    tone: "expiring",
    action: "Review Renewal",
  },
  {
    id: "GATC-DL-11",
    name: "Standard Calibration Labs",
    categories: "Non-Automatic Weighing Scales (Class III)",
    validity: "Suspended",
    validityNote: "Audit Failed: 01 Aug 2026",
    total: "Total: ₹0",
    split: "",
    tone: "suspended",
    action: "View Audit Report",
  },
];

export default function Gatc() {
  const [query, setQuery] = useState("");
  const filteredCentres = useMemo(() => {
    const normalizedQuery = query.toLowerCase().trim();
    if (!normalizedQuery) return centres;
    return centres.filter((centre) =>
      `${centre.id} ${centre.name} ${centre.categories}`
        .toLowerCase()
        .includes(normalizedQuery),
    );
  }, [query]);

  return (
    <DashboardLayout role="admin">
      <section className="mx-auto max-w-[1320px] overflow-hidden rounded-xl border border-[#E0E0E0] bg-white shadow-card">
        <div className="flex flex-col justify-between gap-4 px-7 pb-6 pt-7 sm:flex-row sm:items-center">
          <h1 className="text-2xl font-bold tracking-tight text-[#1A1A2E]">
            GATC Authorization &amp; Revenue Management
          </h1>
          <Button className="h-10 w-fit rounded-lg bg-[#FF6F00] px-4 font-bold text-white shadow-none hover:bg-[#E66000]">
            + Authorize New GATC
          </Button>
        </div>

        <div className="border-t border-[#E8E9EC]" />

        <div className="px-7 pb-7 pt-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <KpiCard title="Total Active GATCs" value="412" detail="Across 28 States & 8 UTs" tone="blue" />
            <KpiCard title="GATC Revenue Generated (YTD)" value="₹21.5 Cr" detail="Automatically split 80:20 (Govt / Test Centre)" tone="green" />
            <KpiCard title="Pending Lab Renewals" value="14 Labs" detail="Licenses expiring in < 30 days" tone="amber" />
          </div>

          <div className="mt-9 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <h2 className="text-lg font-bold text-[#0B3D91]">Authorized Testing Centres Network</h2>
            <div className="relative sm:w-[310px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8A8A98]" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search by Lab Name, ID, or Category..."
                className="h-10 rounded-lg border-[#E0E0E0] pl-9 text-sm shadow-none hover:border-primary focus-visible:border-primary focus-visible:ring-primary/15"
              />
            </div>
          </div>

          <div className="mt-4 overflow-hidden rounded-lg border border-[#E0E0E0]">
            <div className="overflow-x-auto">
              <Table className="min-w-[1100px]">
                <TableHeader>
                  <TableRow className="border-b border-[#E0E0E0] bg-[#F5F7FA] hover:bg-[#F5F7FA]">
                    <TableHead className="h-12 px-5 text-[11px] font-bold uppercase tracking-wide text-[#5C5C70]">GATC ID &amp; Lab Name</TableHead>
                    <TableHead className="h-12 text-[11px] font-bold uppercase tracking-wide text-[#5C5C70]">Authorized Categories (2026 Rules)</TableHead>
                    <TableHead className="h-12 text-[11px] font-bold uppercase tracking-wide text-[#5C5C70]">License Validity</TableHead>
                    <TableHead className="h-12 text-[11px] font-bold uppercase tracking-wide text-[#5C5C70]">Revenue Split (YTD)</TableHead>
                    <TableHead className="h-12 pr-5 text-[11px] font-bold uppercase tracking-wide text-[#5C5C70]">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCentres.map((centre) => (
                    <TableRow key={centre.id} className="border-b border-[#E8E9EC] hover:bg-[#FAFBFC]">
                      <TableCell className="px-5 py-5 align-top">
                        <p className="font-semibold text-[#1A1A2E]">{centre.id}</p>
                        <p className="mt-1 text-sm font-bold text-[#0B3D91]">{centre.name}</p>
                      </TableCell>
                      <TableCell className="max-w-[310px] py-5 align-top text-sm leading-5 text-[#1A1A2E]">
                        {centre.categories}
                      </TableCell>
                      <TableCell className="py-5 align-top">
                        <span className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-bold ${
                          centre.tone === "valid"
                            ? "bg-[#1E8E3E] text-white"
                            : centre.tone === "expiring"
                              ? "bg-[#F9A825] text-[#1A1A2E]"
                              : "bg-[#D32F2F] text-white"
                        }`}>
                          {centre.validity}
                        </span>
                        <p className={`mt-2 whitespace-nowrap text-xs ${centre.tone === "expiring" ? "font-medium text-[#D32F2F]" : "text-[#5C5C70]"}`}>
                          {centre.validityNote}
                        </p>
                      </TableCell>
                      <TableCell className="py-5 align-top">
                        <p className="font-bold text-[#1A1A2E]">{centre.total}</p>
                        {centre.split && <p className="mt-1 text-xs text-[#5C5C70]">{centre.split}</p>}
                      </TableCell>
                      <TableCell className="pr-5 py-5 align-top">
                        {centre.tone === "expiring" ? (
                          <Button className="h-9 whitespace-nowrap rounded-lg bg-[#FF6F00] px-3 text-xs font-bold text-white shadow-none hover:bg-[#E66000]">
                            {centre.action}
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            className={`h-9 whitespace-nowrap px-2 text-xs font-semibold ${centre.tone === "suspended" ? "text-[#D32F2F] hover:bg-[#FFEBEE] hover:text-[#D32F2F]" : "text-[#0B3D91] hover:bg-primary/5 hover:text-[#0B3D91]"}`}
                          >
                            {centre.action}
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredCentres.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="py-12 text-center text-sm text-[#5C5C70]">
                        No testing centres match your search.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
            <div className="flex flex-col gap-3 border-t border-[#E8E9EC] px-5 py-4 text-sm sm:flex-row sm:items-center sm:justify-between">
              <span className="text-[#5C5C70]">Showing 1 to 3 of 412 registered GATCs</span>
              <div className="flex items-center gap-2">
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

function KpiCard({
  title,
  value,
  detail,
  tone,
}: {
  title: string;
  value: string;
  detail: string;
  tone: "blue" | "green" | "amber";
}) {
  const toneClass = tone === "blue" ? "text-[#0B3D91]" : tone === "green" ? "text-[#1E8E3E]" : "text-[#F9A825]";
  return (
    <div className="rounded-lg border border-[#E0E0E0] bg-white p-4 shadow-card">
      <p className="text-sm font-medium text-[#5C5C70]">{title}</p>
      <p className={`mt-3 text-2xl font-extrabold tracking-tight ${toneClass}`}>{value}</p>
      <p className="mt-2 min-h-10 text-xs leading-5 text-[#5C5C70]">{detail}</p>
    </div>
  );
}
