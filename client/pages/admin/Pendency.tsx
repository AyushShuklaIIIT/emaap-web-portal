import { useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  LoaderCircle,
  RefreshCw,
  X,
} from "lucide-react";

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
import {
  usePendencyQueue,
  useApprovePendencyRoute,
  useManualOverridePendency,
  useBulkApprovePendencyRoutes,
} from "@/hooks/useAdminPendency";
import { AssignedType } from "@/services/admin/dashboard.service";
import { SLAStatus } from "@/services/admin/pendency.service";

const LIMIT = 20;

const formatDate = (date: string) =>
  new Date(date).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

const getMutationErrorMessage = (error: unknown, fallback: string) => {
  if (typeof error === "object" && error !== null && "response" in error) {
    const response = (
      error as {
        response?: { data?: { message?: string } };
      }
    ).response;

    if (response?.data?.message) {
      return response.data.message;
    }
  }

  return error instanceof Error ? error.message : fallback;
};

export default function Pendency() {
  const [stateCode, setStateCode] = useState("ALL");
  const [slaStatus, setSlaStatus] = useState<SLAStatus>("ALL");
  const [page, setPage] = useState(1);

  const [selectedAppIds, setSelectedAppIds] = useState<string[]>([]);

  const [routeError, setRouteError] = useState<string | null>(null);

  const [overrideAppId, setOverrideAppId] = useState<string | null>(null);

  const [overrideType, setOverrideType] = useState<AssignedType>("GATC");

  const [overrideId, setOverrideId] = useState("");

  const { data, isLoading, isFetching, isError, error, refetch } =
    usePendencyQueue({
      stateCode,
      slaStatus,
      page,
      limit: LIMIT,
    });

  const approveRouteMutation = useApprovePendencyRoute();

  const manualOverrideMutation = useManualOverridePendency();

  const bulkApproveMutation = useBulkApprovePendencyRoutes();

  const applications = data?.items ?? [];

  const allVisibleSelected =
    applications.length > 0 &&
    applications.every((application) =>
      selectedAppIds.includes(application.app_id),
    );

  const someVisibleSelected =
    applications.some((application) =>
      selectedAppIds.includes(application.app_id),
    ) && !allVisibleSelected;

  const selectedCount = selectedAppIds.length;

  const showingFrom =
    data && data.pagination.total > 0
      ? (data.pagination.page - 1) * data.pagination.limit + 1
      : 0;

  const showingTo =
    data && data.pagination.total > 0
      ? Math.min(
          data.pagination.page * data.pagination.limit,
          data.pagination.total,
        )
      : 0;

  const isLastPage = !data || page >= data.pagination.total_pages;

  const isAnyMutationPending =
    approveRouteMutation.isPending ||
    manualOverrideMutation.isPending ||
    bulkApproveMutation.isPending;

  const handleStateChange = (value: string) => {
    setStateCode(value);
    setPage(1);
    setSelectedAppIds([]);
  };

  const handleSlaChange = (value: string) => {
    setSlaStatus(value as SLAStatus);
    setPage(1);
    setSelectedAppIds([]);
  };

  const toggleApplication = (appId: string) => {
    setSelectedAppIds((current) =>
      current.includes(appId)
        ? current.filter((id) => id !== appId)
        : [...current, appId],
    );
  };

  const toggleSelectAll = () => {
    if (allVisibleSelected) {
      setSelectedAppIds((current) =>
        current.filter(
          (id) =>
            !applications.some((application) => application.app_id === id),
        ),
      );
      return;
    }

    setSelectedAppIds((current) => {
      const ids = new Set(current);

      applications.forEach((application) => {
        ids.add(application.app_id);
      });

      return Array.from(ids);
    });
  };

  const openManualOverride = (appId: string) => {
    setOverrideAppId(appId);
    setOverrideType("GATC");
    setOverrideId("");
  };

  const closeManualOverride = () => {
    if (manualOverrideMutation.isPending) {
      return;
    }

    setOverrideAppId(null);
    setOverrideType("GATC");
    setOverrideId("");
  };

  const handleManualOverride = () => {
    if (!overrideAppId || !overrideId.trim()) {
      return;
    }

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
          setSelectedAppIds((current) =>
            current.filter((id) => id !== overrideAppId),
          );

          setOverrideAppId(null);
          setOverrideType("GATC");
          setOverrideId("");
        },
      },
    );
  };

  const handleBulkApprove = () => {
    if (selectedAppIds.length === 0) {
      return;
    }

    setRouteError(null);

    bulkApproveMutation.mutate(selectedAppIds, {
      onSuccess: () => {
        setSelectedAppIds([]);
      },
      onError: (error) => {
        setRouteError(
          getMutationErrorMessage(error, "Failed to approve selected routes."),
        );
      },
    });
  };

  const handleApproveRoute = (appId: string, gatcId: string) => {
    setRouteError(null);

    approveRouteMutation.mutate(
      {
        appId,
        gatcId,
      },
      {
        onSuccess: () => {
          setSelectedAppIds((current) => current.filter((id) => id !== appId));
        },

        onError: (error) => {
          setRouteError(
            getMutationErrorMessage(error, "Failed to approve route."),
          );
        },
      },
    );
  };

  const handlePreviousPage = () => {
    if (page <= 1) {
      return;
    }

    setSelectedAppIds([]);
    setPage((current) => current - 1);
  };

  const handleNextPage = () => {
    if (!data || page >= data.pagination.total_pages) {
      return;
    }

    setSelectedAppIds([]);
    setPage((current) => current + 1);
  };

  const alertCount = data?.summary.breached_count ?? 0;

  return (
    <DashboardLayout role="admin">
      <section className="mx-auto max-w-330 overflow-hidden rounded-xl border border-[#E0E0E0] bg-white shadow-card">
        <div className="flex flex-col justify-between gap-4 px-4 pb-6 pt-6 sm:flex-row sm:items-center sm:px-7 sm:pt-7">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-[#1A1A2E] sm:text-2xl">
              Pendency Queue &amp; Workflow Engine
            </h1>

            <p className="mt-1 text-sm text-[#5C5C70]">
              Review pending applications and manage algorithmic routing.
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <select
              value={stateCode}
              onChange={(event) => handleStateChange(event.target.value)}
              className="h-10 rounded-lg border border-[#E0E0E0] bg-white px-3 text-sm text-[#1A1A2E] outline-none hover:border-primary focus:border-primary"
            >
              <option value="ALL">State/Zone: All India</option>

              <option value="UP">State/Zone: Uttar Pradesh</option>

              <option value="MH">State/Zone: Maharashtra</option>
            </select>

            <select
              value={slaStatus}
              onChange={(event) => handleSlaChange(event.target.value)}
              className="h-10 rounded-lg border border-[#E0E0E0] bg-white px-3 text-sm text-[#1A1A2E] outline-none hover:border-primary focus:border-primary"
            >
              <option value="ALL">SLA Status: All</option>

              <option value="BREACHED">
                SLA Status: Breached (&gt;15 Days)
              </option>

              <option value="WITHIN_SLA">SLA Status: Within SLA</option>
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
              />
              Refresh
            </Button>
          </div>
        </div>

        <div className="mx-4 flex items-start gap-3 rounded-lg border border-[#FFCDD2] bg-[#FFEBEE] px-4 py-3.5 text-sm text-[#9B1C1C] sm:mx-7">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-[#D32F2F]" />

          <p className="font-bold">
            {stateCode === "UP"
              ? `System Alert: ${alertCount} applications in the UP Zone have breached the 15-day SLA. Algorithmic re-routing to eligible GATCs is recommended.`
              : stateCode === "MH"
                ? `System Alert: ${alertCount} applications in the Maharashtra Zone have breached the 15-day SLA. Algorithmic re-routing to eligible GATCs is recommended.`
                : `System Alert: ${alertCount} applications have breached the 15-day SLA. Algorithmic re-routing to eligible GATCs is recommended.`}
          </p>
        </div>

        {routeError && (
          <div className="mx-4 mt-4 flex items-start justify-between gap-3 rounded-lg border border-[#FFCDD2] bg-[#FFEBEE] px-4 py-3.5 text-sm text-[#9B1C1C] sm:mx-7">
            <p>{routeError}</p>
            <button
              type="button"
              onClick={() => setRouteError(null)}
              className="shrink-0 font-bold"
              aria-label="Dismiss route error"
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
                  <TableRow className="border-b border-[#E0E0E0] bg-[#F5F7FA] hover:bg-[#F5F7FA]">
                    <TableHead className="w-12 px-4">
                      <input
                        type="checkbox"
                        checked={allVisibleSelected}
                        ref={(element) => {
                          if (element) {
                            element.indeterminate = someVisibleSelected;
                          }
                        }}
                        onChange={toggleSelectAll}
                        aria-label="Select all applications"
                        className="h-4 w-4 cursor-pointer rounded border-gray-300"
                      />
                    </TableHead>

                    <TableHead className="h-12 px-5 text-[11px] font-bold uppercase tracking-wide text-[#5C5C70]">
                      App ID &amp; Date
                    </TableHead>

                    <TableHead className="h-12 text-[11px] font-bold uppercase tracking-wide text-[#5C5C70]">
                      Business Entity &amp; Location
                    </TableHead>

                    <TableHead className="h-12 text-[11px] font-bold uppercase tracking-wide text-[#5C5C70]">
                      Instrument Profile
                    </TableHead>

                    <TableHead className="h-12 text-[11px] font-bold uppercase tracking-wide text-[#5C5C70]">
                      SLA Status
                    </TableHead>

                    <TableHead className="h-12 min-w-87.5 text-[11px] font-bold uppercase tracking-wide text-[#5C5C70]">
                      AI Algorithmic Suggestion
                    </TableHead>

                    <TableHead className="h-12 pr-5 text-[11px] font-bold uppercase tracking-wide text-[#5C5C70]">
                      Action
                    </TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="py-16 text-center">
                        <div className="flex items-center justify-center gap-2 text-sm text-[#5C5C70]">
                          <LoaderCircle className="h-5 w-5 animate-spin" />
                          Loading pendency queue...
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : isError ? (
                    <TableRow>
                      <TableCell colSpan={7} className="py-16 text-center">
                        <div className="flex flex-col items-center justify-center gap-3">
                          <AlertTriangle className="h-8 w-8 text-[#D32F2F]" />

                          <p className="font-semibold text-[#1A1A2E]">
                            Failed to load pendency queue
                          </p>

                          <p className="text-sm text-[#5C5C70]">
                            {(error as Error)?.message ||
                              "Something went wrong while fetching applications."}
                          </p>

                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => refetch()}
                          >
                            Try Again
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : applications.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="py-16 text-center">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <CheckCircle2 className="h-8 w-8 text-[#1E8E3E]" />

                          <p className="font-semibold text-[#1A1A2E]">
                            No pending applications found
                          </p>

                          <p className="text-sm text-[#5C5C70]">
                            No applications match the selected filters.
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    applications.map((item) => {
                      const isSelected = selectedAppIds.includes(item.app_id);

                      return (
                        <TableRow
                          key={item.app_id}
                          className={`border-b border-[#E8E9EC] hover:bg-[#FAFBFC] ${
                            isSelected ? "bg-[#F7FAFF]" : ""
                          }`}
                        >
                          <TableCell className="px-4 py-5 align-top">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleApplication(item.app_id)}
                              aria-label={`Select ${item.application_no}`}
                              className="mt-1 h-4 w-4 cursor-pointer rounded border-gray-300"
                            />
                          </TableCell>

                          <TableCell className="px-5 py-5 align-top">
                            <p className="font-semibold text-[#1A1A2E]">
                              {item.application_no}
                            </p>

                            <p className="mt-1 text-xs text-[#5C5C70]">
                              {formatDate(item.submission_timestamp)}
                            </p>

                            <p className="mt-1 text-[11px] text-[#8A8A98]">
                              {item.app_id}
                            </p>
                          </TableCell>

                          <TableCell className="py-5 align-top">
                            <p className="font-semibold text-[#1A1A2E]">
                              {item.business.name}
                            </p>

                            <p className="mt-1 text-xs leading-5 text-[#5C5C70]">
                              {item.business.location}
                            </p>

                            <p className="mt-1 text-xs font-medium text-[#5C5C70]">
                              {item.business.state_code}
                            </p>
                          </TableCell>

                          <TableCell className="max-w-55 py-5 align-top text-sm leading-5 text-[#1A1A2E]">
                            <p className="font-medium">
                              {item.instrument.category}
                            </p>

                            <p className="mt-2 text-xs text-[#5C5C70]">
                              Model: {item.instrument.model_no}
                            </p>

                            <p className="mt-1 text-xs text-[#5C5C70]">
                              Serial: {item.instrument.serial_number}
                            </p>
                          </TableCell>

                          <TableCell className="py-5 align-top">
                            <span
                              className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-bold ${
                                item.sla.status === "BREACHED"
                                  ? "bg-[#D32F2F] text-white"
                                  : "bg-[#1E8E3E] text-white"
                              }`}
                            >
                              {item.sla.label}
                            </span>

                            {item.sla.note && (
                              <p className="mt-2 text-xs font-medium text-[#D32F2F]">
                                {item.sla.note}
                              </p>
                            )}
                          </TableCell>

                          <TableCell className="py-5 align-top">
                            {item.suggestions.length > 0 ? (
                              <div className="rounded-md bg-[#E3F2FD] px-3 py-2.5 text-xs font-medium leading-5 text-[#0B3D91]">
                                <p>
                                  {item.suggestions.length} eligible GATC
                                  {item.suggestions.length === 1
                                    ? ""
                                    : "s"}{" "}
                                  found in the jurisdiction state.
                                </p>
                                <p className="mt-1 text-[11px] text-[#3564A3]">
                                  Nearest: {item.suggestions[0].centre_code} at{" "}
                                  {item.suggestions[0].distance_km} km
                                </p>
                              </div>
                            ) : (
                              <div className="rounded-md bg-[#FFF7ED] px-3 py-2.5 text-xs font-medium leading-5 text-[#9A3412]">
                                No eligible GATC is available in the
                                jurisdiction state.
                              </div>
                            )}
                          </TableCell>

                          <TableCell className="py-5 align-top">
                            {item.suggestions.length === 0 ? (
                              <div className="rounded-md bg-[#FFF7ED] px-3 py-2.5 text-xs font-medium leading-5 text-[#9A3412]">
                                <p>
                                  No eligible GATC is currently available within
                                  the jurisdiction state.
                                </p>
                              </div>
                            ) : (
                              <div className="space-y-2.5">
                                {item.suggestions.map((gatc, index) => (
                                  <div
                                    key={gatc.gatc_id}
                                    className="flex items-center justify-between gap-3 rounded-md border border-[#D9E7F7] bg-[#F4F9FF] px-3 py-2.5"
                                  >
                                    <div className="min-w-0">
                                      <div className="flex items-center gap-2">
                                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#0B3D91] text-[10px] font-bold text-white">
                                          {index + 1}
                                        </span>

                                        <p className="truncate text-xs font-bold text-[#0B3D91]">
                                          {gatc.centre_code}
                                        </p>
                                      </div>

                                      <p className="mt-1 pl-7 text-[11px] text-[#3564A3]">
                                        {gatc.distance_km} km away
                                      </p>
                                    </div>

                                    <Button
                                      type="button"
                                      disabled={isAnyMutationPending}
                                      onClick={() =>
                                        handleApproveRoute(
                                          item.app_id,
                                          gatc.gatc_id,
                                        )
                                      }
                                      className="h-8 shrink-0 whitespace-nowrap rounded-lg bg-[#FF6F00] px-2.5 text-[11px] font-bold text-white shadow-none hover:bg-[#E66000]"
                                    >
                                      {approveRouteMutation.isPending
                                        ? "Approving..."
                                        : "Approve Route"}
                                    </Button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>

            <div className="flex flex-col gap-3 border-t border-[#E8E9EC] px-5 py-4 text-sm sm:flex-row sm:items-center sm:justify-between">
              <Button
                type="button"
                variant="ghost"
                disabled={selectedCount === 0 || bulkApproveMutation.isPending}
                onClick={handleBulkApprove}
                className="w-fit font-semibold text-[#0B3D91] hover:bg-primary/5 hover:text-[#0B3D91]"
              >
                {bulkApproveMutation.isPending ? (
                  <>
                    <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                    Approving Selected...
                  </>
                ) : (
                  <>
                    Bulk Approve Selected Routes
                    {selectedCount > 0 && ` (${selectedCount})`}
                  </>
                )}
              </Button>

              <div className="flex flex-wrap items-center gap-3 text-[#5C5C70]">
                <span>
                  Showing {showingFrom} to {showingTo} of{" "}
                  {data?.pagination.total ?? 0} applications
                </span>

                <Button
                  type="button"
                  variant="ghost"
                  disabled={page <= 1 || isLoading || isFetching}
                  onClick={handlePreviousPage}
                  className="h-9 text-sm text-[#5C5C70] hover:text-[#0B3D91]"
                >
                  &lt; Previous
                </Button>

                <span className="text-xs font-medium">
                  Page {data?.pagination.page ?? page} of{" "}
                  {data?.pagination.total_pages ?? 1}
                </span>

                <Button
                  type="button"
                  variant="ghost"
                  disabled={isLastPage || isLoading || isFetching}
                  onClick={handleNextPage}
                  className="h-9 font-semibold text-[#0B3D91] hover:bg-primary/5"
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
            <div className="flex items-center justify-between border-b border-[#E8E9EC] px-5 py-4">
              <div>
                <h2 className="text-lg font-bold text-[#1A1A2E]">
                  Manual Override
                </h2>

                <p className="mt-1 text-xs text-[#5C5C70]">
                  Application: {overrideAppId}
                </p>
              </div>

              <button
                type="button"
                onClick={closeManualOverride}
                disabled={manualOverrideMutation.isPending}
                className="rounded-md p-1.5 text-[#5C5C70] hover:bg-[#F5F7FA] hover:text-[#1A1A2E]"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 px-5 py-5">
              <div>
                <label
                  htmlFor="assigned-type"
                  className="mb-1.5 block text-sm font-semibold text-[#1A1A2E]"
                >
                  Assignment Type
                </label>

                <select
                  id="assigned-type"
                  value={overrideType}
                  onChange={(event) =>
                    setOverrideType(event.target.value as AssignedType)
                  }
                  disabled={manualOverrideMutation.isPending}
                  className="h-10 w-full rounded-lg border border-[#E0E0E0] bg-white px-3 text-sm text-[#1A1A2E] outline-none focus:border-primary"
                >
                  <option value="GATC">GATC</option>
                  <option value="LMO">LMO</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="assigned-id"
                  className="mb-1.5 block text-sm font-semibold text-[#1A1A2E]"
                >
                  {overrideType === "GATC" ? "GATC ID" : "LMO User ID"}
                </label>

                <input
                  id="assigned-id"
                  type="text"
                  value={overrideId}
                  onChange={(event) => setOverrideId(event.target.value)}
                  placeholder={
                    overrideType === "GATC"
                      ? "Enter GATC ID"
                      : "Enter LMO user ID"
                  }
                  disabled={manualOverrideMutation.isPending}
                  className="h-10 w-full rounded-lg border border-[#E0E0E0] bg-white px-3 text-sm text-[#1A1A2E] outline-none placeholder:text-[#9A9AA3] focus:border-primary"
                />
              </div>

              {manualOverrideMutation.isError && (
                <div className="rounded-lg border border-[#FFCDD2] bg-[#FFEBEE] px-3 py-2.5 text-sm text-[#9B1C1C]">
                  {(manualOverrideMutation.error as Error)?.message ||
                    "Failed to apply manual override."}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  disabled={manualOverrideMutation.isPending}
                  onClick={closeManualOverride}
                >
                  Cancel
                </Button>

                <Button
                  type="button"
                  disabled={
                    !overrideId.trim() || manualOverrideMutation.isPending
                  }
                  onClick={handleManualOverride}
                  className="bg-[#0B3D91] text-white hover:bg-[#093477]"
                >
                  {manualOverrideMutation.isPending ? (
                    <>
                      <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                      Applying...
                    </>
                  ) : (
                    "Apply Override"
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
