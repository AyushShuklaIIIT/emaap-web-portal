import { useMemo, useState } from "react";
import { ArrowUpRight, Download, Radio } from "lucide-react";

import { DashboardLayout } from "@/components/emaap/DashboardLayout";
import { Button } from "@/components/ui/button";

import { downloadAdminDashboardReport } from "@/services/admin/dashboard.service";

import {
  useAdminDashboard,
  useAdminAllocations,
} from "@/hooks/useAdminDashboard";
import { useAdminRealtime } from "@/hooks/useAdminRealtime";

const DEFAULT_FINANCIAL_YEAR = "2026-2027";

const formatCurrencyCrore = (amount: number): string => {
  return `₹${amount}`;
};

const formatNumber = (value: number): string => {
  return value.toLocaleString("en-IN");
};

const formatCompactNumber = (value: number): string => {
  return new Intl.NumberFormat("en-IN", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
};

const getYtdMonthCount = (financialYear: string): number => {
  const match = /^(\d{4})-(\d{4})$/.exec(financialYear);

  if (!match) {
    return 12;
  }

  const startYear = Number(match[1]);
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  if (currentYear === startYear) {
    if (currentMonth < 3) {
      return 0;
    }
    return currentMonth - 2;
  }

  if (currentYear === startYear + 1) {
    return currentMonth >= 3 ? 12 : currentMonth + 10;
  }

  if (currentYear > startYear + 1) {
    return 12;
  }
  return 0;
};

const getChartPoints = (values: number[], maxValue: number): string => {
  if (values.length === 0) {
    return "";
  }

  const startX = 38;
  const endX = 368;
  const chartTop = 35;
  const chartBottom = 155;

  const step = values.length === 1 ? 0 : (endX - startX) / (values.length - 1);

  return values
    .map((value, index) => {
      const x = startX + index * step;
      const ratio = maxValue === 0 ? 0 : value / maxValue;
      const y = chartBottom - ratio * (chartBottom - chartTop);
      return `${x},${y}`;
    })
    .join(" ");
};

const getChartCirclePoints = (values: number[], maxValue: number) => {
  if (values.length === 0) {
    return [];
  }

  const startX = 38;
  const endX = 368;

  const chartTop = 35;
  const chartBottom = 155;

  const step = values.length === 1 ? 0 : (endX - startX) / (values.length - 1);

  return values.map((value, index) => {
    const x = startX + index * step;
    const ratio = maxValue === 0 ? 0 : value / maxValue;
    const y = chartBottom - ratio * (chartBottom - chartTop);

    return {
      x,
      y,
      key: `${index}-${value}`,
    };
  });
};

const getPendencyBarColor = (
  severity: "HIGH" | "MEDIUM" | "NORMAL",
): string => {
  switch (severity) {
    case "HIGH":
      return "bg-[#D32F2F]";

    case "MEDIUM":
      return "bg-[#F9A825]";

    case "NORMAL":
      return "bg-[#1E8E3E]";

    default:
      return "bg-[#1E8E3E]";
  }
};

const formatDistance = (distance: number | null): string => {
  if (distance === null) {
    return "";
  }
  return `Distance: ${distance} km`;
};

export default function AdminDashboard() {
  const [financialYear, setFinancialYear] = useState(DEFAULT_FINANCIAL_YEAR);
  const { data, isLoading, isError } = useAdminDashboard(financialYear);
  useAdminRealtime();
  const {
    allocations,
    isLoading: allocationsLoading,
    isError: allocationsError,
  } = useAdminAllocations();

  const kpis = useMemo(() => {
    if (!data) {
      return [];
    }

    return [
      {
        title: "Total Revenue Collected",
        value: formatCurrencyCrore(data.kpis.total_revenue_collected),
        detail: `Govt: ${formatCurrencyCrore(
          data.kpis.government_share,
        )} | GATCs: ${formatCurrencyCrore(data.kpis.gatc_share)}`,

        accent: "text-[#1A1A2E]",

        trend:
          data.kpis.revenue_growth_yoy_percent !== null
            ? `${data.kpis.revenue_growth_yoy_percent >= 0 ? "+" : ""}${
                data.kpis.revenue_growth_yoy_percent
              }% YoY`
            : undefined,
      },

      {
        title: "Active GATCs & LMOs",
        value: `${formatNumber(data.kpis.active_gatcs_lmos)} Units`,
        detail: `GATCs: ${formatNumber(
          data.kpis.active_gatcs,
        )} | LMOs: ${formatNumber(data.kpis.lmos)}`,
        accent: "text-[#1A1A2E]",
        trend: undefined,
      },

      {
        title: "National Pendency Rate",
        value: `${data.kpis.national_pendency_rate}%`,
        detail: data.kpis.highest_pendency_state
          ? `Alert: High backlog detected in ${data.kpis.highest_pendency_state}`
          : "No significant backlog detected",

        accent: "text-[#F9A825]",
        trend: undefined,
      },

      {
        title: "Total Instruments Verified",
        value: formatNumber(data.kpis.total_instruments_verified),
        detail: `${data.kpis.cryptographically_secured_percentage}% Cryptographically Secured`,
        accent: "text-[#1E8E3E]",
        trend: undefined,
      },
    ];
  }, [data]);

  const monthlyData = useMemo(() => {
    if (!data) {
      return [];
    }

    const monthsToShow = getYtdMonthCount(financialYear);

    return data.monthly_verification_volume.slice(0, monthsToShow);
  }, [data, financialYear]);

  const chartMaxValue = useMemo(() => {
    if (monthlyData.length === 0) {
      return 1;
    }

    const values = monthlyData.flatMap((month) => [month.lmo, month.gatc]);
    const maximum = Math.max(...values);

    if (maximum <= 0) {
      return 1;
    }

    const magnitude = 10 ** Math.floor(Math.log10(maximum));

    return Math.ceil(maximum / magnitude) * magnitude;
  }, [monthlyData]);

  const lmoPoints = useMemo(
    () =>
      getChartPoints(
        monthlyData.map((month) => month.lmo),
        chartMaxValue,
      ),
    [monthlyData, chartMaxValue],
  );

  const gatcPoints = useMemo(
    () =>
      getChartPoints(
        monthlyData.map((month) => month.gatc),
        chartMaxValue,
      ),
    [monthlyData, chartMaxValue],
  );

  const lmoCirclePoints = useMemo(
    () =>
      getChartCirclePoints(
        monthlyData.map((month) => month.lmo),
        chartMaxValue,
      ),
    [monthlyData, chartMaxValue],
  );

  const gatcCirclePoints = useMemo(
    () =>
      getChartCirclePoints(
        monthlyData.map((month) => month.gatc),
        chartMaxValue,
      ),
    [monthlyData, chartMaxValue],
  );

  const axisValues = useMemo(
    () => [chartMaxValue, (chartMaxValue * 2) / 3, chartMaxValue / 3, 0],
    [chartMaxValue],
  );

  const handleExport = async () => {
    try {
      await downloadAdminDashboardReport(financialYear);
    } catch (error) {
      console.error("Failed to export admin report:", error);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout role="admin">
        <section className="mx-auto max-w-7xl rounded-xl border border-[#E0E0E0] bg-white p-8 shadow-card">
          <div className="flex min-h-75 items-center justify-center">
            <p className="text-sm text-[#5C5C70]">Loading admin dashboard...</p>
          </div>
        </section>
      </DashboardLayout>
    );
  }

  if (isError || !data) {
    return (
      <DashboardLayout role="admin">
        <section className="mx-auto max-w-7xl rounded-xl border border-[#E0E0E0] bg-white p-8 shadow-card">
          <div className="flex min-h-75 flex-col items-center justify-center">
            <p className="font-semibold text-red-600">
              Failed to load admin dashboard.
            </p>

            <p className="mt-2 text-sm text-[#5C5C70]">
              Please check that the backend is running and the admin dashboard
              endpoint is available.
            </p>
          </div>
        </section>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="admin">
      <section className="mx-auto max-w-7xl rounded-xl border border-[#E0E0E0] bg-white p-4 shadow-card sm:p-7">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-[#1A1A2E] sm:text-2xl">
              Pan-India Executive Overview
            </h1>

            <p className="mt-1 text-sm text-[#5C5C70]">
              National compliance, revenue and field operations at a glance.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value="ALL"
              disabled
              aria-label="Region"
              className="h-10 cursor-not-allowed rounded-lg border border-[#E0E0E0] bg-[#F5F7FA] px-3 text-sm text-[#1A1A2E] outline-none"
            >
              <option value="ALL">Region: All India</option>
            </select>

            <select
              value={financialYear}
              onChange={(event) => setFinancialYear(event.target.value)}
              aria-label="Financial Year"
              className="h-10 rounded-lg border border-[#E0E0E0] bg-white px-3 text-sm text-[#1A1A2E] outline-none hover:border-primary focus:border-primary"
            >
              <option value="2026-2027">Financial Year: 2026-2027</option>

              <option value="2025-2026">Financial Year: 2025-2026</option>
            </select>

            <Button
              onClick={handleExport}
              className="h-10 rounded-lg bg-[#FF6F00] font-bold text-white shadow-none hover:bg-[#E66000]"
            >
              <Download className="mr-1.5 h-4 w-4" />
              Export Report
            </Button>
          </div>
        </div>

        <div className="mt-6 border-t border-[#E8E9EC] pt-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {kpis.map((kpi) => (
              <div
                key={kpi.title}
                className="rounded-lg border border-[#E0E0E0] bg-white p-5 shadow-card"
              >
                <p className="text-sm font-medium text-[#5C5C70]">
                  {kpi.title}
                </p>

                <p
                  className={`mt-3 text-2xl font-extrabold tracking-tight ${kpi.accent}`}
                >
                  {kpi.value}
                </p>

                <p className="mt-2 min-h-10 text-xs leading-5 text-[#5C5C70]">
                  {kpi.detail}
                </p>

                {kpi.trend && (
                  <div className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-[#1E8E3E]">
                    <ArrowUpRight className="h-3.5 w-3.5" />

                    {kpi.trend}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-5 xl:grid-cols-[3fr_2fr]">
          <div className="rounded-lg border border-[#E0E0E0] bg-white p-5 shadow-card">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-[#0B3D91]">
                  Monthly Verification Volume (YTD)
                </h2>

                <p className="mt-1 text-xs text-[#5C5C70]">
                  Instrument verifications completed by channel
                </p>
              </div>

              <div className="flex flex-wrap gap-3 text-[11px] text-[#5C5C70]">
                <span className="flex items-center gap-1.5">
                  <i className="h-2 w-2 rounded-full bg-[#0B3D91]" />
                  LMO
                </span>

                <span className="flex items-center gap-1.5">
                  <i className="h-2 w-2 rounded-full bg-[#FF6F00]" />
                  GATC
                </span>
              </div>
            </div>

            <div className="mt-5 h-57.5 w-full overflow-hidden">
              {monthlyData.length === 0 ? (
                <div className="flex h-full items-center justify-center text-sm text-[#5C5C70]">
                  No verification data available.
                </div>
              ) : (
                <svg
                  viewBox="0 0 410 205"
                  className="h-full w-full"
                  role="img"
                  aria-label="Monthly verification volume line chart"
                >
                  {[35, 75, 115, 155].map((y) => (
                    <line
                      key={y}
                      x1="38"
                      y1={y}
                      x2="388"
                      y2={y}
                      stroke="#E8E9EC"
                      strokeWidth="1"
                    />
                  ))}

                  <line
                    x1="38"
                    y1="155"
                    x2="388"
                    y2="155"
                    stroke="#BFC4CC"
                    strokeWidth="1"
                  />

                  <text x="5" y="39" fill="#8A8A98" fontSize="10">
                    {formatCompactNumber(axisValues[0])}
                  </text>

                  <text x="5" y="79" fill="#8A8A98" fontSize="10">
                    {formatCompactNumber(axisValues[1])}
                  </text>

                  <text x="5" y="119" fill="#8A8A98" fontSize="10">
                    {formatCompactNumber(axisValues[2])}
                  </text>

                  <text x="21" y="159" fill="#8A8A98" fontSize="10">
                    0
                  </text>

                  <polyline
                    points={lmoPoints}
                    fill="none"
                    stroke="#0B3D91"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />

                  <polyline
                    points={gatcPoints}
                    fill="none"
                    stroke="#FF6F00"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />

                  {lmoCirclePoints.map((point) => (
                    <circle
                      key={`lmo-${point.key}`}
                      cx={point.x}
                      cy={point.y}
                      r="3.5"
                      fill="white"
                      stroke="#0B3D91"
                      strokeWidth="2"
                    />
                  ))}

                  {gatcCirclePoints.map((point) => (
                    <circle
                      key={`gatc-${point.key}`}
                      cx={point.x}
                      cy={point.y}
                      r="3.5"
                      fill="white"
                      stroke="#FF6F00"
                      strokeWidth="2"
                    />
                  ))}

                  {monthlyData.map((month, index) => {
                    const startX = 38;
                    const endX = 368;

                    const step =
                      monthlyData.length === 1
                        ? 0
                        : (endX - startX) / (monthlyData.length - 1);

                    const x = startX + index * step;

                    return (
                      <text
                        key={month.month}
                        x={x}
                        y="181"
                        textAnchor="middle"
                        fill="#8A8A98"
                        fontSize="9"
                      >
                        {month.month}
                      </text>
                    );
                  })}
                </svg>
              )}
            </div>
          </div>

          <div className="rounded-lg border border-[#E0E0E0] bg-white p-5 shadow-card">
            <div>
              <h2 className="text-base font-bold text-[#0B3D91]">
                Critical Pendency by State
              </h2>

              <p className="mt-1 text-xs text-[#5C5C70]">
                Applications awaiting field action
              </p>
            </div>

            <div className="mt-7 space-y-5">
              {data.critical_pendency_by_state.length === 0 ? (
                <div className="py-6 text-center text-sm text-[#5C5C70]">
                  No pendency data available.
                </div>
              ) : (
                data.critical_pendency_by_state.map((state) => {
                  const barColor = getPendencyBarColor(state.severity);

                  return (
                    <div key={state.state_code}>
                      <div className="mb-1.5 flex items-center justify-between text-xs">
                        <span className="font-bold text-[#1A1A2E]">
                          {state.state_code}
                        </span>

                        <span className="text-[#5C5C70]">{state.severity}</span>
                      </div>

                      <div className="h-3 rounded-full bg-[#F0F1F3]">
                        <div
                          className={`h-3 rounded-full ${barColor}`}
                          style={{
                            width: `${Math.min(state.pendency_rate, 100)}%`,
                          }}
                        />
                      </div>

                      <div className="mt-1 text-right text-xs text-[#5C5C70]">
                        {state.pendency_rate}%
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="mt-7 flex gap-4 border-t border-[#E8E9EC] pt-4 text-[11px] text-[#5C5C70]">
              <span className="flex items-center gap-1.5">
                <i className="h-2 w-2 rounded-full bg-[#D32F2F]" />
                High
              </span>

              <span className="flex items-center gap-1.5">
                <i className="h-2 w-2 rounded-full bg-[#F9A825]" />
                Medium
              </span>

              <span className="flex items-center gap-1.5">
                <i className="h-2 w-2 rounded-full bg-[#1E8E3E]" />
                Normal
              </span>
            </div>
          </div>
        </div>

        <div className="mt-6 rounded-lg border border-[#E0E0E0] bg-white shadow-card">
          <div className="flex items-center gap-2 border-b border-[#E8E9EC] px-5 py-4">
            <Radio
              className={`h-4 w-4 text-[#1E8E3E] ${
                allocationsLoading ? "animate-pulse" : ""
              }`}
            />

            <h2 className="text-base font-bold text-[#0B3D91]">
              Live Algorithmic Allocations
            </h2>

            <span className="text-xs text-[#1E8E3E]">Live Data</span>
          </div>

          <div className="divide-y divide-[#E8E9EC]">
            {allocationsLoading ? (
              <div className="px-5 py-6 text-sm text-[#5C5C70]">
                Loading allocations...
              </div>
            ) : allocationsError ? (
              <div className="px-5 py-6 text-sm text-red-600">
                Failed to load allocations.
              </div>
            ) : allocations.length === 0 ? (
              <div className="px-5 py-6 text-sm text-[#5C5C70]">
                No active allocations.
              </div>
            ) : (
              allocations.map((allocation) => (
                <div
                  key={allocation.app_id}
                  className="flex flex-col gap-2 px-5 py-4 text-sm text-[#1A1A2E] sm:flex-row sm:items-center sm:justify-between"
                >
                  <span>
                    {allocation.application_no}
                    {" ("}
                    {allocation.instrument}
                    {") → Auto-assigned to "}

                    {allocation.assigned_type && allocation.assigned_to
                      ? `${allocation.assigned_type}-${allocation.assigned_to}`
                      : "Unassigned"}

                    {allocation.distance_km !== null
                      ? ` (${formatDistance(allocation.distance_km)})`
                      : ""}
                  </span>

                  <span className="w-fit rounded-full bg-[#E8F5E9] px-2.5 py-1 text-xs font-bold text-[#1E8E3E]">
                    {allocation.workflow_status === "ALLOCATED"
                      ? "Dispatched"
                      : allocation.workflow_status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </section>
    </DashboardLayout>
  );
}
