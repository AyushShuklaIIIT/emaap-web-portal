import { useMemo, useState } from "react";
import { ArrowUpRight, Download, Radio } from "lucide-react";

import { DashboardLayout } from "@/components/emaap/DashboardLayout";
import { Button } from "@/components/ui/button";

import {
  useStateAdminDashboard,
  useStateAdminAllocations,
  useStateAdminGatcs,
} from "@/hooks/useStateAdminDashboard";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";
import { downloadStateAdminDashboardReport } from "@/services/admin/state/stateAdminDashboard.service";
import {
  formatCurrencyCrore,
  formatNumber,
  getYtdMonthCount,
  getPendencyBarColor,
} from "../Dashboard";

const DEFAULT_FINANCIAL_YEAR = "2026-2027";

// ... (keep helper functions formatCurrencyCrore, formatNumber, formatCompactNumber, getYtdMonthCount, getChartPoints, getChartCirclePoints, getPendencyBarColor, formatDistance from the original file) ...

export default function StateAdminDashboard() {
  const [financialYear, setFinancialYear] = useState(DEFAULT_FINANCIAL_YEAR);
  const [selectedDistrict, setSelectedDistrict] = useState("All");
  const [selectedGatc, setSelectedGatc] = useState("All");

  const { data, isLoading, isError } = useStateAdminDashboard(financialYear);
  const {
    allocations,
    isLoading: allocationsLoading,
    isError: allocationsError,
  } = useStateAdminAllocations();

  const { gatcs, isLoading: gatcsLoading } = useStateAdminGatcs("All");

  const uniqueDistricts = useMemo(() => {
    const districts = new Set<string>();
    gatcs.forEach((g) => districts.add(g.district || "Unassigned"));
    return Array.from(districts).sort();
  }, [gatcs]);

  const filteredGatcs = useMemo(() => {
    let filtered = gatcs;
    if (selectedDistrict !== "All") {
      filtered = filtered.filter(
        (g) => (g.district || "Unassigned") === selectedDistrict,
      );
    }
    if (selectedGatc !== "All") {
      filtered = filtered.filter((g) => g.gatc_id === selectedGatc);
    }
    return filtered;
  }, [gatcs, selectedDistrict, selectedGatc]);

  const districtGatcOptions = useMemo(() => {
    let options = gatcs;
    if (selectedDistrict !== "All") {
      options = options.filter(
        (g) => (g.district || "Unassigned") === selectedDistrict,
      );
    }
    return options;
  }, [gatcs, selectedDistrict]);

  const kpis = useMemo(() => {
    if (!data) return [];

    return [
      {
        title: "Total State Revenue",
        value: formatCurrencyCrore(data.kpis.total_revenue_collected),
        detail: `Govt: ${formatCurrencyCrore(data.kpis.government_share)} | GATCs: ${formatCurrencyCrore(data.kpis.gatc_share)}`,
        accent: "text-[#1A1A2E]",
        trend:
          data.kpis.revenue_growth_yoy_percent !== null
            ? `${data.kpis.revenue_growth_yoy_percent >= 0 ? "+" : ""}${data.kpis.revenue_growth_yoy_percent}% YoY`
            : undefined,
      },
      {
        title: "Active State Units",
        value: `${formatNumber(data.kpis.active_gatcs_lmos)} Units`,
        detail: `GATCs: ${formatNumber(data.kpis.active_gatcs)} | LMOs: ${formatNumber(data.kpis.lmos)}`,
        accent: "text-[#1A1A2E]",
      },
      {
        title: "State Pendency Rate",
        value: `${data.kpis.state_pendency_rate}%`,
        detail: data.kpis.highest_pendency_district
          ? `Alert: Backlog in ${data.kpis.highest_pendency_district} district`
          : "No significant backlog",
        accent: "text-[#F9A825]",
      },
      {
        title: "State Instruments Verified",
        value: formatNumber(data.kpis.total_instruments_verified),
        detail: `${data.kpis.cryptographically_secured_percentage}% Cryptographically Secured`,
        accent: "text-[#1E8E3E]",
      },
    ];
  }, [data]);

  // Chart setup logic reused from original ...
  const monthlyData = useMemo(() => {
    if (!data) return [];
    return data.monthly_verification_volume.slice(
      0,
      getYtdMonthCount(financialYear),
    );
  }, [data, financialYear]);

  // ... (Include chartMaxValue, lmoPoints, gatcPoints, etc.) ...

  const handleExport = async () => {
    try {
      await downloadStateAdminDashboardReport(financialYear);
    } catch (error) {
      console.error("Failed to export state report:", error);
    }
  };

  if (isLoading) {
    return <DashboardLayout role="state-admin" children={""}></DashboardLayout>;
  }

  return (
    <DashboardLayout role="state-admin">
      <section className="mx-auto max-w-7xl rounded-xl border border-[#E0E0E0] bg-white p-4 shadow-card sm:p-7">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-[#1A1A2E] sm:text-2xl">
              State Executive Overview {data ? `(${data.state_code})` : ""}
            </h1>
            <p className="mt-1 text-sm text-[#5C5C70]">
              Regional compliance, revenue and field operations at a glance.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={financialYear}
              onChange={(e) => setFinancialYear(e.target.value)}
              className="h-10 rounded-lg border border-[#E0E0E0] bg-white px-3 text-sm text-[#1A1A2E] outline-none hover:border-primary focus:border-primary"
            >
              <option value="2026-2027">Financial Year: 2026-2027</option>
              <option value="2025-2026">Financial Year: 2025-2026</option>
            </select>
            <Button
              onClick={handleExport}
              className="h-10 rounded-lg bg-[#FF6F00] font-bold text-white hover:bg-[#E66000]"
            >
              <Download className="mr-1.5 h-4 w-4" /> Export Report
            </Button>
          </div>
        </div>

        {/* KPI Grid (identical structure) */}
        {/* ... */}

        <div className="mt-6 grid grid-cols-1 gap-5 xl:grid-cols-[3fr_2fr]">
          {/* Monthly Line Chart (identical structure) */}
          {/* ... */}

          <div className="rounded-lg border border-[#E0E0E0] bg-white p-5 shadow-card">
            <div>
              <h2 className="text-base font-bold text-[#0B3D91]">
                Critical Pendency by District
              </h2>
              <p className="mt-1 text-xs text-[#5C5C70]">
                Applications awaiting field action in your jurisdiction
              </p>
            </div>

            <div className="mt-7 space-y-5">
              {data?.critical_pendency_by_district.length === 0 ? (
                <div className="py-6 text-center text-sm text-[#5C5C70]">
                  No pendency data available.
                </div>
              ) : (
                data?.critical_pendency_by_district.map((district) => {
                  const barColor = getPendencyBarColor(district.severity);
                  return (
                    <div key={district.district_name}>
                      <div className="mb-1.5 flex items-center justify-between text-xs">
                        <span className="font-bold text-[#1A1A2E]">
                          {district.district_name}
                        </span>
                        <span className="text-[#5C5C70]">
                          {district.severity}
                        </span>
                      </div>
                      <div className="h-3 rounded-full bg-[#F0F1F3]">
                        <div
                          className={`h-3 rounded-full ${barColor}`}
                          style={{
                            width: `${Math.min(district.pendency_rate, 100)}%`,
                          }}
                        />
                      </div>
                      <div className="mt-1 text-right text-xs text-[#5C5C70]">
                        {district.pendency_rate}%
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </section>

      {/* State GATCs Section */}
      <section className="mt-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
          <h2 className="text-xl font-bold text-[#0B3D91]">
            Authorized Testing Centres Network
          </h2>
          <div className="flex flex-col sm:flex-row gap-4 mt-4 sm:mt-0">
            <select
              className="px-3 py-2 border rounded-md border-[#E0E0E0] text-sm"
              value={selectedDistrict}
              onChange={(e) => {
                setSelectedDistrict(e.target.value);
                setSelectedGatc("All");
              }}
            >
              <option value="All">All Districts</option>
              {uniqueDistricts.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
            <select
              className="px-3 py-2 border rounded-md border-[#E0E0E0] text-sm"
              value={selectedGatc}
              onChange={(e) => setSelectedGatc(e.target.value)}
            >
              <option value="All">All GATCs</option>
              {districtGatcOptions.map((g) => (
                <option key={g.gatc_id} value={g.gatc_id}>
                  {g.lab_name || g.centre_code}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="rounded-lg border border-[#E0E0E0] bg-white shadow-card">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-[#E0E0E0] bg-[#F8F9FA] hover:bg-[#F8F9FA]">
                <TableHead className="py-4 text-[#5C5C70] font-semibold text-sm">Centre Code</TableHead>
                <TableHead className="py-4 text-[#5C5C70] font-semibold text-sm">Lab Name</TableHead>
                <TableHead className="py-4 text-[#5C5C70] font-semibold text-sm">District</TableHead>
                <TableHead className="py-4 text-[#5C5C70] font-semibold text-sm">Status</TableHead>
                <TableHead className="py-4 text-[#5C5C70] font-semibold text-sm">Valid Until</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {gatcsLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-6">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : filteredGatcs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-6 text-[#5C5C70]">
                    No GATCs found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredGatcs.map((gatc) => (
                  <TableRow key={gatc.gatc_id}>
                    <TableCell className="font-medium text-[#1A1A2E]">{gatc.centre_code}</TableCell>
                    <TableCell>{gatc.lab_name || "N/A"}</TableCell>
                    <TableCell>{gatc.district}</TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                          gatc.status === "ACTIVE"
                            ? "bg-emerald-100 text-emerald-700"
                            : gatc.status === "SUSPENDED"
                            ? "bg-amber-100 text-amber-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {gatc.status}
                      </span>
                    </TableCell>
                    <TableCell>
                      {gatc.valid_to ? format(new Date(gatc.valid_to), "dd MMM yyyy") : "N/A"}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </section>
    </DashboardLayout>
  );
}
