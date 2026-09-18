import { useMemo, useState } from "react";
import { Download, Search } from "lucide-react";
import { DashboardLayout } from "@/components/emaap/DashboardLayout";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useInstruments } from "@/hooks/useInstruments";
import { Instrument } from "@/services/instrument.service";

const EXPIRING_DAYS = 30;

const getLatestCertificate = (certificates: Instrument["certificates"]) => {
  if (certificates.length === 0) {
    return null;
  }

  return [...certificates].sort(
    (a, b) =>
      new Date(b.issue_date).getTime() - new Date(a.issue_date).getTime(),
  )[0];
};

const isCertificateExpiringSoon = (expiryDate: string | null): boolean => {
  if (!expiryDate) {
    return false;
  }

  const expiryTime = new Date(expiryDate).getTime();
  const now = Date.now();

  const diff = expiryTime - now;
  const thirtyDays = EXPIRING_DAYS * 24 * 60 * 60 * 1000;

  return diff >= 0 && diff <= thirtyDays;
};

const formatDate = (date: string | null): string => {
  if (!date) {
    return "N/A";
  }

  return new Date(date).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

export default function Instruments({ userId }: { userId: string }) {
  const navigate = useNavigate();

  const [query, setQuery] = useState("");
  const [state, setState] = useState("all");
  const [status, setStatus] = useState("all");

  const { instruments, isLoading, isError } = useInstruments(userId, query);

  const filteredInstruments = useMemo(() => {
    return instruments.filter((instrument) => {
      const matchesState = state === "all" || instrument.state === state;

      const latestCertificate = getLatestCertificate(instrument.certificates);

      const isExpiring = isCertificateExpiringSoon(
        latestCertificate?.expiry_date ?? null,
      );

      const matchesStatus =
        status === "all" ||
        (status === "verified" &&
          instrument.status === "VERIFIED" &&
          !isExpiring) ||
        (status === "expiring" &&
          instrument.status === "VERIFIED" &&
          isExpiring);

      return matchesState && matchesStatus;
    });
  }, [instruments, state, status]);

  if (isLoading) {
    return (
      <DashboardLayout role="business">
        <section className="mx-auto max-w-310 rounded-xl border border-[#E0E0E0] bg-white p-8 shadow-card">
          <p className="text-sm text-[#5C5C70]">Loading instruments...</p>
        </section>
      </DashboardLayout>
    );
  }

  if (isError) {
    return (
      <DashboardLayout role="business">
        <section className="mx-auto max-w-310 rounded-xl border border-[#E0E0E0] bg-white p-8 shadow-card">
          <p className="text-sm text-red-600">Failed to load instruments.</p>
        </section>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="business">
      <section className="mx-auto max-w-310 overflow-hidden rounded-xl border border-[#E0E0E0] bg-white shadow-card">
        <div className="flex flex-col gap-5 px-4 pb-6 pt-6 sm:px-7 sm:pt-7 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-[#1A1A2E] sm:text-2xl">
              My Instruments &amp; Certificates
            </h1>

            <p className="mt-1 text-sm text-[#5C5C70]">
              Manage your pan-India instrument verification records and
              certificates.
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative min-w-0 sm:w-67.5">
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

              <option value="Delhi">State: Delhi</option>

              <option value="Maharashtra">State: Maharashtra</option>

              <option value="Uttar Pradesh">State: Uttar Pradesh</option>
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
          <Table className="mobile-card-table min-w-225">
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
              {filteredInstruments.map((instrument) => {
                const latestCertificate = getLatestCertificate(
                  instrument.certificates,
                );

                const isExpiring = isCertificateExpiringSoon(
                  latestCertificate?.expiry_date ?? null,
                );

                return (
                  <TableRow
                    key={instrument.instrument_id}
                    className="border-b border-[#E8E9EC] hover:bg-[#FAFBFC]"
                  >
                    <TableCell className="px-7 py-5 align-top">
                      <div className="max-w-57.5 font-semibold leading-5 text-[#1A1A2E]">
                        {instrument.category.category_name}
                      </div>

                      <div className="mt-1 text-xs font-medium text-[#5C5C70]">
                        Serial No.{" "}
                        <span className="text-[#1A1A2E]">
                          {instrument.serial_number}
                        </span>
                      </div>
                    </TableCell>

                    <TableCell className="max-w-52.5 py-5 align-top text-sm leading-5 text-[#1A1A2E]">
                      <div>{instrument.address}</div>

                      <div className="mt-1 text-xs text-[#5C5C70]">
                        {instrument.state} - {instrument.pincode}
                      </div>
                    </TableCell>

                    <TableCell className="py-5 align-top">
                      <div className="text-sm font-medium text-[#1A1A2E]">
                        {formatDate(latestCertificate?.issue_date ?? null)}
                      </div>

                      <div className="mt-1 text-xs text-[#5C5C70]">
                        {latestCertificate?.certificate_no ?? "No certificate"}
                      </div>
                    </TableCell>

                    <TableCell className="py-5 align-top">
                      <div
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${
                          isExpiring
                            ? "bg-[#F9A825] text-[#1A1A2E]"
                            : "bg-[#1E8E3E] text-white"
                        }`}
                      >
                        {isExpiring ? "Expiring Soon" : "Verified"}
                      </div>

                      <div
                        className={`mt-2 text-xs ${
                          isExpiring
                            ? "font-medium text-[#D32F2F]"
                            : "text-[#5C5C70]"
                        }`}
                      >
                        Expires:{" "}
                        {formatDate(latestCertificate?.expiry_date ?? null)}
                      </div>
                    </TableCell>

                    <TableCell className="py-5 pr-7 align-top">
                      {isExpiring ? (
                        <Button
                          onClick={() => navigate("/business/new-application")}
                          className="h-9 rounded-lg bg-[#FF6F00] px-3 text-xs font-bold text-white shadow-none hover:bg-[#E66000]"
                        >
                          Renew Now
                        </Button>
                      ) : latestCertificate ? (
                        <Button
                          variant="ghost"
                          onClick={() =>
                            window.open(
                              latestCertificate.dynamic_qr_url,
                              "_blank",
                            )
                          }
                          className="h-9 gap-1.5 px-2 text-xs font-semibold text-[#0B3D91] hover:bg-primary/5 hover:text-[#0B3D91]"
                        >
                          <Download className="h-4 w-4" />
                          Download QR Cert
                        </Button>
                      ) : (
                        <span className="text-xs text-[#5C5C70]">
                          No certificate
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}

              {filteredInstruments.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="py-12 text-center text-sm text-[#5C5C70]"
                  >
                    No instruments match your search or filters.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <div className="flex flex-col gap-3 border-t border-[#E8E9EC] px-4 py-4 text-sm sm:flex-row sm:items-center sm:justify-between sm:px-7">
          <span className="text-[#5C5C70]">
            Showing {filteredInstruments.length} instruments
          </span>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              className="h-9 text-sm text-[#5C5C70] hover:text-[#0B3D91]"
              disabled
            >
              &lt; Previous
            </Button>

            <Button
              variant="ghost"
              className="h-9 font-semibold text-[#0B3D91] hover:bg-primary/5"
              disabled
            >
              Next &gt;
            </Button>
          </div>
        </div>
      </section>
    </DashboardLayout>
  );
}
