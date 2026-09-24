import { useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  LoaderCircle,
  RefreshCw,
  X,
  MapPin,
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
import {
  useStateAdminPendencyQueue,
  useApproveStatePendencyRoute,
  useManualOverrideStatePendency,
  useBulkApproveStatePendencyRoutes,
} from "@/hooks/useStateAdminPendency";
import { SLAStatus } from "@/services/admin/pendency.service";

// Re-use utilities
const LIMIT = 20;
const formatDate = (date: string) =>
  new Date(date).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
const getMutationErrorMessage = (error: any, fallback: string) =>
  error?.response?.data?.message || error?.message || fallback;

export default function StateAdminPendency() {
  const [district, setDistrict] = useState("");
  const [districtInput, setDistrictInput] = useState("");
  const [slaStatus, setSlaStatus] = useState<SLAStatus>("ALL");
  const [page, setPage] = useState(1);
  const [selectedAppIds, setSelectedAppIds] = useState<string[]>([]);
  const [routeError, setRouteError] = useState<string | null>(null);

  // Manual override states
  const [overrideAppId, setOverrideAppId] = useState<string | null>(null);
  const [overrideType, setOverrideType] = useState<"LMO" | "GATC">("GATC");
  const [overrideId, setOverrideId] = useState("");

  const { data, isLoading, isFetching, isError, error, refetch } =
    useStateAdminPendencyQueue({
      district: district || undefined,
      slaStatus,
      page,
      limit: LIMIT,
    });

  const approveRouteMutation = useApproveStatePendencyRoute();
  const manualOverrideMutation = useManualOverrideStatePendency();
  const bulkApproveMutation = useBulkApproveStatePendencyRoutes();

  const applications = data?.items ?? [];
  const alertCount = data?.summary.breached_count ?? 0;

  const allVisibleSelected =
    applications.length > 0 &&
    applications.every((a) => selectedAppIds.includes(a.app_id));
  const someVisibleSelected =
    applications.some((a) => selectedAppIds.includes(a.app_id)) &&
    !allVisibleSelected;
  const selectedCount = selectedAppIds.length;

  const handleSlaChange = (value: string) => {
    setSlaStatus(value as SLAStatus);
    setPage(1);
    setSelectedAppIds([]);
  };
  const applyDistrictFilter = () => {
    setDistrict(districtInput.trim());
    setPage(1);
    setSelectedAppIds([]);
  };
  const toggleApplication = (appId: string) =>
    setSelectedAppIds((c) =>
      c.includes(appId) ? c.filter((id) => id !== appId) : [...c, appId],
    );
  const toggleSelectAll = () => {
    if (allVisibleSelected)
      setSelectedAppIds((c) =>
        c.filter((id) => !applications.some((a) => a.app_id === id)),
      );
    else
      setSelectedAppIds(
        Array.from(
          new Set([...selectedAppIds, ...applications.map((a) => a.app_id)]),
        ),
      );
  };

  const handleApproveRoute = (appId: string, gatcId: string) => {
    setRouteError(null);
    approveRouteMutation.mutate(
      { appId, route: { gatcId } },
      {
        onSuccess: () =>
          setSelectedAppIds((c) => c.filter((id) => id !== appId)),
        onError: (err) =>
          setRouteError(
            getMutationErrorMessage(err, "Failed to approve route."),
          ),
      },
    );
  };

  const handleManualOverride = () => {
    if (!overrideAppId || !overrideId.trim()) return;
    manualOverrideMutation.mutate(
      {
        appId: overrideAppId,
        payload: {
          assigned_type: overrideType,
          assigned_id: overrideId.trim(),
        },
      },
      {
        onSuccess: () => {
          setSelectedAppIds((c) => c.filter((id) => id !== overrideAppId));
          setOverrideAppId(null);
          setOverrideId("");
        },
      },
    );
  };

  const handleBulkApprove = () => {
    if (selectedAppIds.length === 0) return;
    setRouteError(null);
    bulkApproveMutation.mutate(selectedAppIds, {
      onSuccess: () => setSelectedAppIds([]),
      onError: (err) =>
        setRouteError(
          getMutationErrorMessage(err, "Failed to approve selected routes."),
        ),
    });
  };

  return (
    <DashboardLayout role="state-admin">
      <section className="mx-auto max-w-330 overflow-hidden rounded-xl border border-[#E0E0E0] bg-white shadow-card">
        {/* Header & Filters */}
        <div className="flex flex-col justify-between gap-4 px-4 pb-6 pt-6 sm:flex-row sm:items-center sm:px-7 sm:pt-7">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-[#1A1A2E] sm:text-2xl">
              State Pendency Queue
            </h1>
            <p className="mt-1 text-sm text-[#5C5C70]">
              Review regional applications and manage algorithmic routing.
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="relative w-48">
              <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8A8A98]" />
              <Input
                placeholder="Filter by District..."
                value={districtInput}
                onChange={(e) => setDistrictInput(e.target.value)}
                onBlur={applyDistrictFilter}
                onKeyDown={(e) => e.key === "Enter" && applyDistrictFilter()}
                className="h-10 rounded-lg border-[#E0E0E0] pl-9 text-sm"
              />
            </div>

            <select
              value={slaStatus}
              onChange={(e) => handleSlaChange(e.target.value)}
              className="h-10 rounded-lg border border-[#E0E0E0] px-3 text-sm text-[#1A1A2E] outline-none hover:border-primary focus:border-primary"
            >
              <option value="ALL">SLA Status: All</option>
              <option value="BREACHED">Breached (&gt;15 Days)</option>
              <option value="WITHIN_SLA">Within SLA</option>
            </select>

            <Button
              type="button"
              variant="outline"
              onClick={() => refetch()}
              disabled={isFetching}
              className="h-10 gap-2 rounded-lg"
            >
              <RefreshCw
                className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`}
              />{" "}
              Refresh
            </Button>
          </div>
        </div>

        {/* SLA Alert */}
        <div className="mx-4 flex items-start gap-3 rounded-lg border border-[#FFCDD2] bg-[#FFEBEE] px-4 py-3.5 text-sm text-[#9B1C1C] sm:mx-7">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-[#D32F2F]" />
          <p className="font-bold">
            System Alert: {alertCount} applications in your jurisdiction{" "}
            {district ? `(${district})` : ""} have breached the 15-day SLA.
            Algorithmic re-routing to eligible regional GATCs is recommended.
          </p>
        </div>

        {routeError && (
          <div className="mx-4 mt-4 flex items-start justify-between gap-3 rounded-lg border border-[#FFCDD2] bg-[#FFEBEE] px-4 py-3.5 text-sm text-[#9B1C1C] sm:mx-7">
            <p>{routeError}</p>
            <button
              type="button"
              onClick={() => setRouteError(null)}
              className="shrink-0 font-bold"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        <div className="mx-4 mt-6 border-t border-[#E8E9EC] sm:mx-7" />

        <div className="px-4 pb-7 pt-6 sm:px-7">
          <div className="overflow-hidden rounded-lg border border-[#E0E0E0]">
            <div className="overflow-x-auto">
              <Table className="min-w-7xl">
                <TableHeader>
                  <TableRow className="border-b border-[#E0E0E0] bg-[#F5F7FA]">
                    <TableHead className="w-12 px-4">
                      <input
                        type="checkbox"
                        checked={allVisibleSelected}
                        onChange={toggleSelectAll}
                        className="h-4 w-4 cursor-pointer rounded border-gray-300"
                      />
                    </TableHead>
                    <TableHead className="h-12 px-5 text-[11px] font-bold uppercase text-[#5C5C70]">
                      App ID &amp; Date
                    </TableHead>
                    <TableHead className="h-12 text-[11px] font-bold uppercase text-[#5C5C70]">
                      Business Entity &amp; Location
                    </TableHead>
                    <TableHead className="h-12 text-[11px] font-bold uppercase text-[#5C5C70]">
                      Instrument Profile
                    </TableHead>
                    <TableHead className="h-12 text-[11px] font-bold uppercase text-[#5C5C70]">
                      SLA Status
                    </TableHead>
                    <TableHead className="h-12 min-w-87.5 text-[11px] font-bold uppercase text-[#5C5C70]">
                      AI Algorithmic Suggestion
                    </TableHead>
                    <TableHead className="h-12 pr-5 text-[11px] font-bold uppercase text-[#5C5C70]">
                      Action
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="py-16 text-center">
                        <LoaderCircle className="mx-auto h-5 w-5 animate-spin text-[#5C5C70]" />
                      </TableCell>
                    </TableRow>
                  ) : applications.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={7}
                        className="py-16 text-center text-[#5C5C70]"
                      >
                        No pending applications found in this region.
                      </TableCell>
                    </TableRow>
                  ) : (
                    applications.map((item) => (
                      <TableRow
                        key={item.app_id}
                        className="border-b border-[#E8E9EC] hover:bg-[#FAFBFC]"
                      >
                        <TableCell className="px-4 py-5 align-top">
                          <input
                            type="checkbox"
                            checked={selectedAppIds.includes(item.app_id)}
                            onChange={() => toggleApplication(item.app_id)}
                            className="h-4 w-4 rounded"
                          />
                        </TableCell>
                        <TableCell className="px-5 py-5 align-top">
                          <p className="font-semibold text-[#1A1A2E]">
                            {item.application_no}
                          </p>
                          <p className="mt-1 text-xs text-[#5C5C70]">
                            {formatDate(item.submission_timestamp)}
                          </p>
                        </TableCell>
                        <TableCell className="py-5 align-top">
                          <p className="font-semibold text-[#1A1A2E]">
                            {item.business.name}
                          </p>
                          <p className="mt-1 text-xs leading-5 text-[#5C5C70]">
                            {item.business.location}
                          </p>
                        </TableCell>
                        <TableCell className="py-5 align-top">
                          <p className="font-medium text-[#1A1A2E]">
                            {item.instrument.category}
                          </p>
                          <p className="mt-1 text-xs text-[#5C5C70]">
                            S/N: {item.instrument.serial_number}
                          </p>
                        </TableCell>
                        <TableCell className="py-5 align-top">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${item.sla.status === "BREACHED" ? "bg-[#D32F2F] text-white" : "bg-[#1E8E3E] text-white"}`}
                          >
                            {item.sla.label}
                          </span>
                        </TableCell>
                        <TableCell className="py-5 align-top">
                          {/* Same suggestion boxes as central */}
                          {item.suggestions.length > 0 ? (
                            <div className="rounded-md bg-[#E3F2FD] px-3 py-2.5 text-xs font-medium text-[#0B3D91]">
                              {item.suggestions.length} eligible route(s) found
                              in your state.
                            </div>
                          ) : (
                            <div className="rounded-md bg-[#FFF7ED] px-3 py-2.5 text-xs font-medium text-[#9A3412]">
                              No eligible routes available in this state.
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="py-5 align-top">
                          {item.suggestions.map((suggestion, idx) => (
                            <div
                              key={idx}
                              className="mb-2 flex items-center justify-between gap-3 rounded-md border border-[#D9E7F7] bg-[#F4F9FF] px-3 py-2.5"
                            >
                              <p className="text-xs font-bold text-[#0B3D91]">
                                {suggestion.type === "GATC"
                                  ? suggestion.centre_code
                                  : suggestion.name}
                              </p>
                              {suggestion.type === "GATC" ? (
                                <Button
                                  onClick={() =>
                                    handleApproveRoute(
                                      item.app_id,
                                      suggestion.gatc_id,
                                    )
                                  }
                                  className="h-8 rounded-lg bg-[#FF6F00] text-[11px] font-bold text-white"
                                >
                                  Approve
                                </Button>
                              ) : (
                                <Button
                                  onClick={() => {
                                    setOverrideAppId(item.app_id);
                                    setOverrideType("LMO");
                                    setOverrideId(suggestion.lmo_id);
                                    handleManualOverride();
                                  }}
                                  className="h-8 rounded-lg bg-[#0B3D91] text-[11px] font-bold text-white"
                                >
                                  Assign LMO
                                </Button>
                              )}
                            </div>
                          ))}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination & Bulk Action */}
            <div className="flex flex-col gap-3 border-t border-[#E8E9EC] px-5 py-4 text-sm sm:flex-row sm:items-center sm:justify-between">
              <Button
                type="button"
                variant="ghost"
                disabled={selectedCount === 0 || bulkApproveMutation.isPending}
                onClick={handleBulkApprove}
                className="font-semibold text-[#0B3D91]"
              >
                Bulk Approve Selected{" "}
                {selectedCount > 0 && `(${selectedCount})`}
              </Button>
              <div className="flex gap-2 text-[#5C5C70]">
                <Button
                  variant="ghost"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  &lt; Prev
                </Button>
                <span className="flex items-center">
                  Page {page} of {data?.pagination.total_pages || 1}
                </span>
                <Button
                  variant="ghost"
                  disabled={!data || page >= data.pagination.total_pages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next &gt;
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {overrideAppId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b px-5 py-4">
              <h2 className="text-lg font-bold text-[#1A1A2E]">
                Manual Override
              </h2>
              <button onClick={() => setOverrideAppId(null)}>
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4 px-5 py-5">
              <select
                value={overrideType}
                onChange={(e) => setOverrideType(e.target.value as any)}
                className="h-10 w-full rounded-lg border px-3 text-sm"
              >
                <option value="GATC">GATC</option>
                <option value="LMO">LMO</option>
              </select>
              <Input
                placeholder={`Enter ${overrideType} ID`}
                value={overrideId}
                onChange={(e) => setOverrideId(e.target.value)}
              />
              <div className="flex justify-end gap-2">
                <Button variant="ghost" onClick={() => setOverrideAppId(null)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleManualOverride}
                  className="bg-[#0B3D91] text-white"
                >
                  Apply Override
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
