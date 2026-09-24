import { useMemo, useState } from "react";

import {
  Download,
  Search,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
} from "lucide-react";

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
import { useStateAdminFinancial } from "@/hooks/useStateAdminFinancial";
import { useStateAdminGatcs } from "@/hooks/useStateAdminDashboard";
import {
  FinancialTransaction,
  RevenueTrend,
} from "@/services/admin/financial.service";

export default function StateFinancial() {
  const {
    data,
    filters,

    loading,
    error,

    search,
    setDateRange,
    setPage,

    setApplicationType,
    setWorkflowStatus,
    setPaymentStatus,
    setDistrict,
    setGatc,

    exportReport,
    refetch,
  } = useStateAdminFinancial();

  const [searchInput, setSearchInput] = useState("");

  const [startDate, setStartDate] = useState(filters.startDate ?? "2026-04-01");

  const [endDate, setEndDate] = useState(filters.endDate ?? "2026-09-05");

  const [applicationFilter, setApplicationFilter] = useState("");

  const [paymentFilter, setPaymentFilter] = useState("");

  const [workflowFilter, setWorkflowFilter] = useState("");

  const [districtFilter, setDistrictFilter] = useState("");
  const [gatcFilter, setGatcFilter] = useState("");

  const { gatcs } = useStateAdminGatcs("All");

  const uniqueDistricts = useMemo(() => {
    const districts = new Set<string>();
    gatcs.forEach((g) => districts.add(g.district || "Unassigned"));
    return Array.from(districts).sort();
  }, [gatcs]);

  const gatcOptions = useMemo(() => {
    let options = gatcs;
    if (districtFilter) {
      options = options.filter(
        (g) => (g.district || "Unassigned") === districtFilter
      );
    }
    return options;
  }, [gatcs, districtFilter]);

  const handleSearch = () => {
    search(searchInput);
  };

  const handleDateChange = (nextStartDate: string, nextEndDate: string) => {
    setStartDate(nextStartDate);

    setEndDate(nextEndDate);

    setDateRange(nextStartDate, nextEndDate);
  };

  const handleApplicationFilter = (value: string) => {
    setApplicationFilter(value);

    setApplicationType(
      value ? (value as "INITIAL" | "RE_VERIFICATION") : undefined,
    );
  };

  const handleWorkflowFilter = (value: string) => {
    setWorkflowFilter(value);

    setWorkflowStatus(
      value
        ? (value as "SUBMITTED" | "ALLOCATED" | "CERTIFIED" | "REJECTED")
        : undefined,
    );
  };

  const handlePaymentFilter = (value: string) => {
    setPaymentFilter(value);

    setPaymentStatus(
      value ? (value as "PENDING" | "SUCCESS" | "FAILED") : undefined,
    );
  };

  const handleDistrictFilter = (value: string) => {
    setDistrictFilter(value);
    setDistrict(value || "");
    // Reset GATC when district changes
    setGatcFilter("");
    setGatc("");
  };

  const handleGatcFilter = (value: string) => {
    setGatcFilter(value);
    setGatc(value || "");
  };

  return (
    <DashboardLayout role="state-admin">
      <section className="mx-auto max-w-330 rounded-xl border border-[#E0E0E0] bg-white p-4 shadow-card sm:p-7">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <h1 className="text-xl font-bold tracking-tight text-[#1A1A2E] sm:text-2xl">
            Financial Reports
          </h1>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2">
              <Input
                type="date"
                value={startDate}
                onChange={(event) =>
                  handleDateChange(event.target.value, endDate)
                }
                className="h-10 w-37.5 rounded-lg border-[#E0E0E0] text-sm"
              />

              <span className="text-sm text-[#5C5C70]">-</span>

              <Input
                type="date"
                value={endDate}
                onChange={(event) =>
                  handleDateChange(startDate, event.target.value)
                }
                className="h-10 w-37.5 rounded-lg border-[#E0E0E0] text-sm"
              />
            </div>

            <select
              value={districtFilter}
              onChange={(event) => handleDistrictFilter(event.target.value)}
              className="h-10 max-w-40 rounded-lg border border-[#E0E0E0] bg-white px-3 text-sm text-[#1A1A2E] outline-none"
            >
              <option value="">District: All</option>
              {uniqueDistricts.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>

            <select
              value={gatcFilter}
              onChange={(event) => handleGatcFilter(event.target.value)}
              className="h-10 max-w-40 rounded-lg border border-[#E0E0E0] bg-white px-3 text-sm text-[#1A1A2E] outline-none"
            >
              <option value="">GATC: All</option>
              {gatcOptions.map((g) => (
                <option key={g.gatc_id} value={g.gatc_id}>
                  {g.lab_name || g.centre_code}
                </option>
              ))}
            </select>

            <select
              value={applicationFilter}
              onChange={(event) => handleApplicationFilter(event.target.value)}
              className="h-10 rounded-lg border border-[#E0E0E0] bg-white px-3 text-sm text-[#1A1A2E] outline-none hover:border-primary focus:border-primary"
            >
              <option value="">Application: All</option>

              <option value="INITIAL">Initial</option>

              <option value="RE_VERIFICATION">Re-verification</option>
            </select>

            <select
              value={paymentFilter}
              onChange={(event) => handlePaymentFilter(event.target.value)}
              className="h-10 rounded-lg border border-[#E0E0E0] bg-white px-3 text-sm text-[#1A1A2E] outline-none"
            >
              <option value="">Payment: All</option>

              <option value="SUCCESS">Successful</option>

              <option value="PENDING">Pending</option>

              <option value="FAILED">Failed</option>
            </select>

            <Button
              onClick={exportReport}
              disabled={loading || !data}
              className="h-10 bg-[#FF6F00] font-bold text-white shadow-none hover:bg-[#E66000]"
            >
              <Download className="mr-1.5 h-4 w-4" />
              Export Financial CSV
            </Button>
          </div>
        </div>

        {error && (
          <div className="mt-5 flex items-center justify-between rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <span>{error}</span>

            <Button variant="outline" size="sm" onClick={refetch}>
              Retry
            </Button>
          </div>
        )}

        <div className="mt-6 border-t border-[#E8E9EC] pt-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Kpi
              title="Gross Revenue"
              value={formatCrore(data?.summary.grossRevenue ?? 0)}
              detail={`${formatNumber(
                data?.summary.transactionCount ?? 0,
              )} successful transactions`}
              tone="blue"
            />

            <Kpi
              title="State Treasury Share"
              value={formatCrore(data?.summary.stateTreasuryShare ?? 0)}
              detail={`${formatPercentage(
                data?.distribution.governmentPercentage ?? 0,
              )} of gross revenue`}
              tone="green"
            />

            <Kpi
              title="GATC Share"
              value={formatCrore(data?.summary.gatcShare ?? 0)}
              detail={`${formatPercentage(
                data?.distribution.gatcPercentage ?? 0,
              )} of gross revenue`}
              tone="amber"
            />

            <Kpi
              title="Statutory Fees"
              value={formatCrore(data?.summary.statutoryFees ?? 0)}
              detail="Statutory verification fees"
              tone="dark"
            />
          </div>
        </div>

        <section className="mt-8">
          <h2 className="text-lg font-bold text-[#0B3D91]">
            Revenue Collection Trends
          </h2>

          <div className="mt-4 grid grid-cols-1 gap-5 rounded-lg border border-[#E0E0E0] p-5 xl:grid-cols-[1fr_270px]">
            <RevenueChart trends={data?.trends ?? []} />

            <RevenueDistribution
              governmentPercentage={
                data?.distribution.governmentPercentage ?? 0
              }
              gatcPercentage={data?.distribution.gatcPercentage ?? 0}
            />
          </div>
        </section>

        <section className="mt-8">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-lg font-bold text-[#0B3D91]">
                Recent Statutory Fee Transactions
              </h2>

              <p className="mt-1 text-xs text-[#8A8A98]">
                Showing successful financial transactions
              </p>
            </div>

            <div className="flex gap-2">
              <div className="relative sm:w-75">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8A8A98]" />

                <Input
                  value={searchInput}
                  onChange={(event) => setSearchInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      handleSearch();
                    }
                  }}
                  placeholder="Search by TXN ID or Business Name..."
                  className="h-10 rounded-lg border-[#E0E0E0] pl-9 text-sm shadow-none"
                />
              </div>

              <Button
                variant="outline"
                size="icon"
                onClick={handleSearch}
                title="Search"
              >
                <Search className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="mt-4 overflow-hidden rounded-lg border border-[#E0E0E0]">
            <div className="overflow-x-auto">
              <Table className="min-w-275">
                <TableHeader>
                  <TableRow className="border-b border-[#E0E0E0] bg-[#F5F7FA] hover:bg-[#F5F7FA]">
                    <TableHead className="h-12 px-5 text-[11px] font-bold uppercase tracking-wide text-[#5C5C70]">
                      Date &amp; TXN ID
                    </TableHead>

                    <TableHead className="h-12 text-[11px] font-bold uppercase tracking-wide text-[#5C5C70]">
                      Corporate Entity
                    </TableHead>

                    <TableHead className="h-12 text-[11px] font-bold uppercase tracking-wide text-[#5C5C70]">
                      Instrument &amp; Category
                    </TableHead>

                    <TableHead className="h-12 text-[11px] font-bold uppercase tracking-wide text-[#5C5C70]">
                      Application
                    </TableHead>

                    <TableHead className="h-12 text-[11px] font-bold uppercase tracking-wide text-[#5C5C70]">
                      Gross Amount
                    </TableHead>

                    <TableHead className="h-12 pr-5 text-[11px] font-bold uppercase tracking-wide text-[#5C5C70]">
                      Payment
                    </TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {loading ? (
                    <LoadingRows />
                  ) : data?.transactions?.length ? (
                    data.transactions.map((transaction) => (
                      <TransactionRow
                        key={transaction.receiptId}
                        transaction={transaction}
                      />
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="py-12 text-center text-sm text-[#5C5C70]"
                      >
                        No financial transactions found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>

          {data && (
            <div className="mt-4 flex items-center justify-between">
              <p className="text-sm text-[#5C5C70]">
                Page{" "}
                <span className="font-semibold text-[#1A1A2E]">
                  {data.pagination.page}
                </span>{" "}
                of{" "}
                <span className="font-semibold text-[#1A1A2E]">
                  {data.pagination.totalPages}
                </span>
                <span className="ml-2">
                  ({data.pagination.total} transactions)
                </span>
              </p>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={data.pagination.page <= 1 || loading}
                  onClick={() => setPage(data.pagination.page - 1)}
                >
                  <ChevronLeft className="mr-1 h-4 w-4" />
                  Previous
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  disabled={
                    data.pagination.page >= data.pagination.totalPages ||
                    loading
                  }
                  onClick={() => setPage(data.pagination.page + 1)}
                >
                  Next
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </section>
      </section>
    </DashboardLayout>
  );
}

export function TransactionRow({
  transaction,
}: {
  transaction: FinancialTransaction;
}) {
  return (
    <TableRow className="border-b border-[#E8E9EC] hover:bg-[#FAFBFC]">
      <TableCell className="px-5 py-5 align-top">
        <p className="font-semibold text-[#1A1A2E]">
          {formatDate(transaction.transactionDate)}
        </p>

        <p className="mt-1 text-xs text-[#5C5C70]">
          {transaction.transactionId ?? transaction.receiptNo}
        </p>
      </TableCell>

      <TableCell className="py-5 align-top">
        <p className="text-sm font-semibold text-[#1A1A2E]">
          {transaction.businessName}
        </p>

        <p className="mt-1 text-xs text-[#5C5C70]">
          {transaction.registrationNumber}
        </p>
      </TableCell>

      <TableCell className="max-w-75 py-5 align-top">
        <p className="text-sm font-semibold text-[#1A1A2E]">
          {transaction.instrumentCategory}
        </p>

        <p className="mt-1 text-sm text-[#5C5C70]">
          {transaction.instrumentModel}
        </p>

        <p className="mt-1 text-xs text-[#8A8A98]">
          S/N: {transaction.instrumentSerialNumber}
        </p>
      </TableCell>

      <TableCell className="py-5 align-top">
        <span className="inline-flex rounded-full bg-[#EEF3FA] px-2.5 py-1 text-xs font-bold text-[#0B3D91]">
          {formatApplicationType(transaction.applicationType)}
        </span>

        <p className="mt-2 text-xs text-[#5C5C70]">
          {formatWorkflowStatus(transaction.workflowStatus)}
        </p>
      </TableCell>

      <TableCell className="py-5 align-top">
        <p className="font-bold text-[#1A1A2E]">
          {formatCurrency(transaction.totalAmount)}
        </p>

        <p className="mt-1 text-xs text-[#5C5C70]">
          Govt: {formatCurrency(transaction.govtShare)}
        </p>

        <p className="text-xs text-[#5C5C70]">
          GATC: {formatCurrency(transaction.gatcShare)}
        </p>
      </TableCell>

      <TableCell className="pr-5 py-5 align-top">
        <span
          className={`
            inline-flex rounded-full px-2.5 py-1 text-xs font-bold
            ${
              transaction.paymentStatus === "SUCCESS"
                ? "bg-[#1E8E3E] text-white"
                : transaction.paymentStatus === "PENDING"
                  ? "bg-[#F9A825] text-[#1A1A2E]"
                  : "bg-[#D32F2F] text-white"
            }
          `}
        >
          {transaction.paymentStatus}
        </span>

        {transaction.paymentMethod && (
          <p className="mt-2 text-xs text-[#5C5C70]">
            {formatPaymentMethod(transaction.paymentMethod)}
          </p>
        )}
      </TableCell>
    </TableRow>
  );
}

export function RevenueChart({ trends }: { trends: RevenueTrend[] }) {
  const maxValue = Math.max(...trends.map((item) => item.totalRevenue), 1);

  const chartWidth = 620;

  const chartHeight = 230;

  const chartBottom = 190;

  const chartTop = 25;

  const chartLeft = 55;

  const chartRight = 600;

  const chartHeightPx = chartBottom - chartTop;

  return (
    <div className="min-w-0">
      <div className="mb-3 flex flex-wrap gap-4 text-xs text-[#5C5C70]">
        <span className="flex items-center gap-1.5">
          <i className="h-2.5 w-2.5 rounded-sm bg-[#0B3D91]" />
          Statutory Fees
        </span>

        <span className="flex items-center gap-1.5">
          <i className="h-2.5 w-2.5 rounded-sm bg-[#FF6F00]" />
          Carriage Charges
        </span>

        <span className="flex items-center gap-1.5">
          <i className="h-2.5 w-2.5 rounded-sm bg-[#1E8E3E]" />
          Adjusting Charges
        </span>
      </div>

      <div className="h-62.5 w-full">
        {!trends.length ? (
          <div className="flex h-full items-center justify-center text-sm text-[#8A8A98]">
            No revenue data available.
          </div>
        ) : (
          <svg
            viewBox={`0 0 ${chartWidth} ${chartHeight}`}
            className="h-full w-full"
            role="img"
            aria-label="Monthly revenue collection chart"
          >
            {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
              const y = chartBottom - ratio * chartHeightPx;

              return (
                <g key={ratio}>
                  <line
                    x1={chartLeft}
                    y1={y}
                    x2={chartRight}
                    y2={y}
                    stroke="#E8E9EC"
                    strokeWidth="1"
                  />

                  <text x="4" y={y + 4} fill="#8A8A98" fontSize="10">
                    {formatCrore(maxValue * ratio)}
                  </text>
                </g>
              );
            })}

            {trends.map((month, index) => {
              const spacing = trends.length > 1 ? 545 / (trends.length - 1) : 0;

              const x = trends.length === 1 ? 289 : 83 + index * spacing;

              const total = month.totalRevenue;

              const totalHeight = (total / maxValue) * chartHeightPx;

              const statutoryHeight =
                total > 0 ? (month.verificationFees / total) * totalHeight : 0;

              const carriageHeight =
                total > 0 ? (month.carriageCharges / total) * totalHeight : 0;

              const adjustingHeight =
                total > 0 ? (month.adjustingCharges / total) * totalHeight : 0;

              const barWidth = trends.length > 8 ? 28 : 42;

              return (
                <g key={`${month.month}-${index}`}>
                  {/* Statutory */}

                  <rect
                    x={x - barWidth / 2}
                    y={chartBottom - statutoryHeight}
                    width={barWidth}
                    height={statutoryHeight}
                    rx="3"
                    fill="#0B3D91"
                  />

                  {/* Carriage */}

                  <rect
                    x={x - barWidth / 2}
                    y={chartBottom - statutoryHeight - carriageHeight}
                    width={barWidth}
                    height={carriageHeight}
                    rx="3"
                    fill="#FF6F00"
                  />

                  {/* Adjusting */}

                  <rect
                    x={x - barWidth / 2}
                    y={
                      chartBottom -
                      statutoryHeight -
                      carriageHeight -
                      adjustingHeight
                    }
                    width={barWidth}
                    height={adjustingHeight}
                    rx="3"
                    fill="#1E8E3E"
                  />

                  <text
                    x={x}
                    y="214"
                    textAnchor="middle"
                    fill="#5C5C70"
                    fontSize="10"
                  >
                    {formatMonthLabel(month.month)}
                  </text>
                </g>
              );
            })}

            <line
              x1={chartLeft}
              y1={chartBottom}
              x2={chartRight}
              y2={chartBottom}
              stroke="#BFC4CC"
              strokeWidth="1"
            />
          </svg>
        )}
      </div>
    </div>
  );
}

export function RevenueDistribution({
  governmentPercentage,
  gatcPercentage,
}: {
  governmentPercentage: number;
  gatcPercentage: number;
}) {
  const governmentDegrees = governmentPercentage * 3.6;

  return (
    <div className="flex flex-col items-center justify-center border-t border-[#E8E9EC] pt-5 xl:border-l xl:border-t-0 xl:pl-5 xl:pt-0">
      <p className="text-sm font-bold text-[#0B3D91]">Revenue Distribution</p>

      <div
        className="relative mt-4 h-36 w-36 rounded-full"
        style={{
          background: `conic-gradient(
            #0B3D91 0deg ${governmentDegrees}deg,
            #FF6F00 ${governmentDegrees}deg 360deg
          )`,
        }}
      >
        <div className="absolute inset-6 flex items-center justify-center rounded-full bg-white text-center">
          <span className="text-lg font-extrabold text-[#1A1A2E]">
            {Math.round(governmentPercentage)}:{Math.round(gatcPercentage)}
          </span>
        </div>
      </div>

      <div className="mt-4 flex gap-4 text-xs text-[#5C5C70]">
        <span className="flex items-center gap-1.5">
          <i className="h-2 w-2 rounded-full bg-[#0B3D91]" />
          Govt {formatPercentage(governmentPercentage)}
        </span>

        <span className="flex items-center gap-1.5">
          <i className="h-2 w-2 rounded-full bg-[#FF6F00]" />
          GATC {formatPercentage(gatcPercentage)}
        </span>
      </div>
    </div>
  );
}

export function LoadingRows() {
  return (
    <>
      {Array.from({
        length: 5,
      }).map((_, index) => (
        <TableRow key={index} className="border-b border-[#E8E9EC]">
          {Array.from({
            length: 6,
          }).map((_, cellIndex) => (
            <TableCell key={cellIndex} className="py-6">
              <div className="h-4 w-3/4 animate-pulse rounded bg-[#EEF0F3]" />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  );
}

export function Kpi({
  title,
  value,
  detail,
  tone,
}: {
  title: string;
  value: string;
  detail: string;
  tone: "blue" | "green" | "amber" | "dark";
}) {
  const valueClass =
    tone === "blue"
      ? "text-[#0B3D91]"
      : tone === "green"
        ? "text-[#1E8E3E]"
        : tone === "amber"
          ? "text-[#F9A825]"
          : "text-[#1A1A2E]";

  return (
    <div className="rounded-lg border border-[#E0E0E0] bg-white p-4 shadow-card">
      <p className="text-sm font-medium text-[#5C5C70]">{title}</p>

      <p
        className={`mt-3 text-2xl font-extrabold tracking-tight ${valueClass}`}
      >
        {value}
      </p>

      <p className="mt-2 text-xs leading-5 text-[#5C5C70]">{detail}</p>
    </div>
  );
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatCrore(amount: number) {
  if (!amount) {
    return "₹0";
  }

  const crore = amount;

  return `₹${crore.toLocaleString("en-IN", {
    maximumFractionDigits: 1,
  })}`;
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-IN").format(value);
}

function formatPercentage(value: number) {
  return `${value.toFixed(1)}%`;
}

function formatDate(value: string | null) {
  if (!value) {
    return "N/A";
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function formatApplicationType(value: "INITIAL" | "RE_VERIFICATION") {
  if (value === "RE_VERIFICATION") {
    return "Re-verification";
  }

  return "Initial";
}

function formatWorkflowStatus(
  value: "SUBMITTED" | "ALLOCATED" | "CERTIFIED" | "REJECTED",
) {
  switch (value) {
    case "SUBMITTED":
      return "Submitted";

    case "ALLOCATED":
      return "Allocated";

    case "CERTIFIED":
      return "Certified";

    case "REJECTED":
      return "Rejected";

    default:
      return value;
  }
}

function formatPaymentMethod(value: "UPI" | "NET_BANKING" | "NEFT_RTGS") {
  switch (value) {
    case "NET_BANKING":
      return "Net Banking";

    case "NEFT_RTGS":
      return "NEFT / RTGS";

    case "UPI":
      return "UPI";

    default:
      return value;
  }
}

function formatMonthLabel(value: string) {
  const date = new Date(`${value}-01`);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-IN", {
    month: "short",
  }).format(date);
}
