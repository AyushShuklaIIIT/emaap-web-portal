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

const instruments = [
  {
    category: "CNG Dispenser (Multi-Nozzle)",
    serial: "SN-8849201",
    location: "Jio-BP Station, BKC, Mumbai (MH)",
    verified: "12 Oct 2025",
    authority: "GATC-MH-04",
    status: "Verified",
    expiry: "Expires: 11 Oct 2026",
    expiring: false,
  },
  {
    category: "60-Ton Road Weighbridge",
    serial: "SN-WB-7729",
    location: "Logistics Hub, Gurugram (HR)",
    verified: "20 Sep 2025",
    authority: "LMO-HR-12",
    status: "Expiring Soon",
    expiry: "Expires: 19 Sep 2026",
    expiring: true,
  },
  {
    category: "Non-Automatic Weighing Scale (Class III)",
    serial: "SN-WS-991",
    location: "Reliance Smart, Surat (GJ)",
    verified: "05 Jan 2026",
    authority: "LMO-GJ-02",
    status: "Verified",
    expiry: "Expires: 04 Jan 2027",
    expiring: false,
  },
];

export default function Instruments() {
  const [query, setQuery] = useState("");
  const [state, setState] = useState("all");
  const [status, setStatus] = useState("all");

  const filteredInstruments = useMemo(() => {
    const normalizedQuery = query.toLowerCase().trim();
    return instruments.filter((instrument) => {
      const matchesQuery =
        !normalizedQuery ||
        `${instrument.category} ${instrument.serial}`
          .toLowerCase()
          .includes(normalizedQuery);
      const matchesState =
        state === "all" || instrument.location.includes(`(${state})`);
      const matchesStatus =
        status === "all" ||
        (status === "verified" && instrument.status === "Verified") ||
        (status === "expiring" && instrument.status === "Expiring Soon");
      return matchesQuery && matchesState && matchesStatus;
    });
  }, [query, state, status]);

  return (
    <DashboardLayout role="business">
      <section className="mx-auto max-w-[1240px] overflow-hidden rounded-xl border border-[#E0E0E0] bg-white shadow-card">
        <div className="flex flex-col gap-5 px-7 pb-6 pt-7 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[#1A1A2E]">
              My Instruments &amp; Certificates
            </h1>
            <p className="mt-1 text-sm text-[#5C5C70]">
              Manage your pan-India instrument verification records and certificates.
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative min-w-0 sm:w-[270px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8A8A98]" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search by Serial No. or Category..."
                className="h-10 rounded-lg border-[#E0E0E0] pl-9 text-sm shadow-none hover:border-primary focus-visible:border-primary focus-visible:ring-primary/15"
              />
            </div>
            <select
              value={state}
              onChange={(event) => setState(event.target.value)}
              aria-label="Filter by state"
              className="h-10 rounded-lg border border-[#E0E0E0] bg-white px-3 text-sm text-[#1A1A2E] outline-none hover:border-primary focus:border-primary"
            >
              <option value="all">State: All India</option>
              <option value="MH">State: Maharashtra</option>
              <option value="HR">State: Haryana</option>
              <option value="GJ">State: Gujarat</option>
            </select>
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value)}
              aria-label="Filter by status"
              className="h-10 rounded-lg border border-[#E0E0E0] bg-white px-3 text-sm text-[#1A1A2E] outline-none hover:border-primary focus:border-primary"
            >
              <option value="all">Status: All</option>
              <option value="verified">Status: Verified</option>
              <option value="expiring">Status: Expiring Soon</option>
            </select>
          </div>
        </div>

        <div className="border-t border-[#E8E9EC]" />

        <div className="overflow-x-auto">
          <Table className="min-w-[900px]">
            <TableHeader>
              <TableRow className="border-b border-[#E0E0E0] bg-[#F5F7FA] hover:bg-[#F5F7FA]">
                <TableHead className="h-12 px-7 text-[11px] font-bold uppercase tracking-wide text-[#5C5C70]">
                  Instrument Details
                </TableHead>
                <TableHead className="h-12 text-[11px] font-bold uppercase tracking-wide text-[#5C5C70]">
                  Installed Location
                </TableHead>
                <TableHead className="h-12 text-[11px] font-bold uppercase tracking-wide text-[#5C5C70]">
                  Last Verified
                </TableHead>
                <TableHead className="h-12 text-[11px] font-bold uppercase tracking-wide text-[#5C5C70]">
                  Status &amp; Expiry
                </TableHead>
                <TableHead className="h-12 pr-7 text-[11px] font-bold uppercase tracking-wide text-[#5C5C70]">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredInstruments.map((instrument) => (
                <TableRow key={instrument.serial} className="border-b border-[#E8E9EC] hover:bg-[#FAFBFC]">
                  <TableCell className="px-7 py-5 align-top">
                    <div className="max-w-[230px] font-semibold leading-5 text-[#1A1A2E]">
                      {instrument.category}
                    </div>
                    <div className="mt-1 text-xs font-medium text-[#5C5C70]">
                      Serial No. <span className="text-[#1A1A2E]">{instrument.serial}</span>
                    </div>
                  </TableCell>
                  <TableCell className="max-w-[210px] py-5 align-top text-sm leading-5 text-[#1A1A2E]">
                    {instrument.location}
                  </TableCell>
                  <TableCell className="py-5 align-top">
                    <div className="text-sm font-medium text-[#1A1A2E]">{instrument.verified}</div>
                    <div className="mt-1 text-xs text-[#5C5C70]">{instrument.authority}</div>
                  </TableCell>
                  <TableCell className="py-5 align-top">
                    <div
                      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${
                        instrument.expiring
                          ? "bg-[#F9A825] text-[#1A1A2E]"
                          : "bg-[#1E8E3E] text-white"
                      }`}
                    >
                      {instrument.status}
                    </div>
                    <div
                      className={`mt-2 text-xs ${
                        instrument.expiring ? "font-medium text-[#D32F2F]" : "text-[#5C5C70]"
                      }`}
                    >
                      {instrument.expiry}
                    </div>
                  </TableCell>
                  <TableCell className="pr-7 py-5 align-top">
                    {instrument.expiring ? (
                      <Button className="h-9 rounded-lg bg-[#FF6F00] px-3 text-xs font-bold text-white shadow-none hover:bg-[#E66000]">
                        Renew Now
                      </Button>
                    ) : (
                      <Button
                        variant="ghost"
                        className="h-9 gap-1.5 px-2 text-xs font-semibold text-[#0B3D91] hover:bg-primary/5 hover:text-[#0B3D91]"
                      >
                        <Download className="h-4 w-4" />
                        Download QR Cert
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {filteredInstruments.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="py-12 text-center text-sm text-[#5C5C70]">
                    No instruments match your search or filters.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <div className="flex flex-col gap-3 border-t border-[#E8E9EC] px-7 py-4 text-sm sm:flex-row sm:items-center sm:justify-between">
          <span className="text-[#5C5C70]">
            Showing 1 to 3 of 1,240 instruments
          </span>
          <div className="flex items-center gap-2">
            <Button variant="ghost" className="h-9 text-sm text-[#5C5C70] hover:text-[#0B3D91]">
              &lt; Previous
            </Button>
            <Button variant="ghost" className="h-9 font-semibold text-[#0B3D91] hover:bg-primary/5">
              Next &gt;
            </Button>
          </div>
        </div>
      </section>
    </DashboardLayout>
  );
}
