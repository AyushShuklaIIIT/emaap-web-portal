import { useMemo, useState } from "react";
import { Loader2, Search } from "lucide-react";
import { DashboardLayout } from "@/components/emaap/DashboardLayout";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  const [centresData, setCentresData] = useState(centres);
  const [query, setQuery] = useState("");
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeGatcs, setActiveGatcs] = useState(412);
  const { toast } = useToast();
  const filteredCentres = useMemo(() => {
    const normalizedQuery = query.toLowerCase().trim();
    if (!normalizedQuery) return centresData;
    return centresData.filter((centre) =>
      `${centre.id} ${centre.name} ${centre.categories}`
        .toLowerCase()
        .includes(normalizedQuery),
    );
  }, [centresData, query]);

  const handleApprove = () => {
    const newCentre = {
      id: "GATC-MH-99",
      name: "TechMeasure Engineering Labs",
      categories: "Energy Dispensing (CNG, LNG), Automatic Rail Weighbridges",
      validity: "Valid",
      validityNote: "Expires: 17 Sep 2027",
      total: "Total: ₹0",
      split: "(Govt: ₹0 | GATC: ₹0)",
      tone: "valid",
      action: "View Profile",
    };

    setIsLoading(true);
    window.setTimeout(() => {
      setCentresData((current) => [newCentre, ...current]);
      setActiveGatcs((current) => current + 1);
      setIsLoading(false);
      setIsReviewOpen(false);
      toast({
        title: "GATC authorization approved",
        description: `${newCentre.id} was issued to TechMeasure Engineering Labs.`,
      });
    }, 1500);
  };

  return (
    <DashboardLayout role="admin">
      <section className="mx-auto max-w-330 overflow-hidden rounded-xl border border-[#E0E0E0] bg-white shadow-card">
        <div className="flex flex-col justify-between gap-4 px-4 pb-6 pt-6 sm:flex-row sm:items-center sm:px-7 sm:pt-7">
          <h1 className="text-xl font-bold tracking-tight text-[#1A1A2E] sm:text-2xl">
            GATC Authorization &amp; Revenue Management
          </h1>
          <Button
            onClick={() => setIsReviewOpen(true)}
            className="h-10 w-fit rounded-lg bg-[#FF6F00] px-4 font-bold text-white shadow-none hover:bg-[#E66000]"
          >
            + Authorize New GATC
          </Button>
        </div>

        <div className="border-t border-[#E8E9EC]" />

        <div className="px-4 pb-7 pt-6 sm:px-7">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <KpiCard title="Total Active GATCs" value={String(activeGatcs)} detail="Across 28 States & 8 UTs" tone="blue" />
            <KpiCard title="GATC Revenue Generated (YTD)" value="₹21.5 Cr" detail="Automatically split 80:20 (Govt / Test Centre)" tone="green" />
            <KpiCard title="Pending Lab Renewals" value="14 Labs" detail="Licenses expiring in < 30 days" tone="amber" />
          </div>

          <div className="mt-9 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <h2 className="text-lg font-bold text-[#0B3D91]">Authorized Testing Centres Network</h2>
            <div className="relative sm:w-77.5">
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
              <Table className="mobile-card-table min-w-275">
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
                    (() => {
                      let validityClassName = "bg-[#D32F2F] text-white";
                      if (centre.tone === "valid") {
                        validityClassName = "bg-[#1E8E3E] text-white";
                      } else if (centre.tone === "expiring") {
                        validityClassName = "bg-[#F9A825] text-[#1A1A2E]";
                      }

                      return <TableRow key={centre.id} className="border-b border-[#E8E9EC] hover:bg-[#FAFBFC]">
                      <TableCell className="px-5 py-5 align-top">
                        <p className="font-semibold text-[#1A1A2E]">{centre.id}</p>
                        <p className="mt-1 text-sm font-bold text-[#0B3D91]">{centre.name}</p>
                      </TableCell>
                      <TableCell className="max-w-77.5 py-5 align-top text-sm leading-5 text-[#1A1A2E]">
                        {centre.categories}
                      </TableCell>
                      <TableCell className="py-5 align-top">
                        <span className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-bold ${validityClassName}`}>
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
                      </TableRow>;
                    })()
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

      <Dialog open={isReviewOpen} onOpenChange={setIsReviewOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto bg-white sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-[#1A1A2E]">
              Review Pending GATC Recognition Application
            </DialogTitle>
            <DialogDescription>
              Review the private laboratory application before issuing authorization.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 border-y border-[#E8E9EC] py-5 sm:grid-cols-2">
            <ReviewField label="Applicant Entity" value="TechMeasure Engineering & Calibration Labs" />
            <ReviewField label="Location" value="Pune, Maharashtra" />
            <ReviewField label="Principal Officer" value="Dr. A. K. Sharma" />
            <ReviewField label="Officer Qualification & Experience" value="M.Sc Physics | 7 Years Metrology Experience" highlight />
            <ReviewField label="Requested Scope (2026 Rules)" value="Energy Dispensing (CNG, LNG), Automatic Rail Weighbridges" />
            <ReviewField label="Equipment Traceability" value="NABL Accredited - Valid till 2028" check />
            <div className="rounded-lg bg-[#E3F2FD] p-4 sm:col-span-2">
              <p className="text-xs font-bold uppercase tracking-wide text-[#0B3D91]">Joint Inspection Report</p>
              <p className="mt-2 text-sm font-medium leading-5 text-[#1A1A2E]">Physically Audited & Recommended by LMO-MH-12 on 10 Sep 2026</p>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-3">
            <Button
              variant="ghost"
              disabled={isLoading}
              onClick={() => setIsReviewOpen(false)}
              className="text-[#D32F2F] hover:bg-[#FFEBEE] hover:text-[#D32F2F]"
            >
              Reject Application
            </Button>
            <Button
              disabled={isLoading}
              onClick={handleApprove}
              className="bg-[#FF6F00] font-bold text-white shadow-none hover:bg-[#E66000]"
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isLoading ? "Generating ID..." : "Approve & Issue GATC ID"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}

function ReviewField({
  label,
  value,
  highlight = false,
  check = false,
}: Readonly<{ label: string; value: string; highlight?: boolean; check?: boolean }>) {
  return (
    <div className={highlight ? "rounded-lg bg-[#E8F5E9] p-3" : "p-1"}>
      <p className="text-xs font-bold uppercase tracking-wide text-[#5C5C70]">{label}</p>
      <p className="mt-1 text-sm font-semibold leading-5 text-[#1A1A2E]">
        {check && <span className="mr-1 text-[#1E8E3E]" aria-label="Verified">✓</span>}
        {value}
      </p>
    </div>
  );
}

function KpiCard({
  title,
  value,
  detail,
  tone,
}: Readonly<{
  title: string;
  value: string;
  detail: string;
  tone: "blue" | "green" | "amber";
}>) {
  let toneClass = "text-[#F9A825]";
  if (tone === "blue") {
    toneClass = "text-[#0B3D91]";
  } else if (tone === "green") {
    toneClass = "text-[#1E8E3E]";
  }
  return (
    <div className="rounded-lg border border-[#E0E0E0] bg-white p-4 shadow-card">
      <p className="text-sm font-medium text-[#5C5C70]">{title}</p>
      <p className={`mt-3 text-2xl font-extrabold tracking-tight ${toneClass}`}>{value}</p>
      <p className="mt-2 min-h-10 text-xs leading-5 text-[#5C5C70]">{detail}</p>
    </div>
  );
}