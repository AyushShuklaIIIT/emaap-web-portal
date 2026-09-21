import { useState } from "react";

import { Loader2, Search, X } from "lucide-react";

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
import { useGatc } from "@/hooks/useAdminGatc";
import {
  GatcProfile,
  GatcListItem,
  CreateGatcPayload,
} from "@/services/admin/gatc.service";

export default function Gatc() {
  const {
    dashboard,

    gatcs,
    pagination,

    page,

    loadingDashboard,
    loadingGatcs,
    actionLoading,

    search,

    createGatc,
    updateStatus,
    getGatcProfile,

    searchGatcs,

    nextPage,
    previousPage,
  } = useGatc();

  const { toast } = useToast();

  const [isAuthorizeOpen, setIsAuthorizeOpen] = useState(false);

  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const [selectedGatc, setSelectedGatc] = useState<GatcProfile | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleViewProfile = async (gatc: GatcListItem) => {
    try {
      setIsSubmitting(true);

      const profile = await getGatcProfile(gatc.gatc_id);

      setSelectedGatc(profile);
      setIsProfileOpen(true);
    } catch (error) {
      toast({
        title: "Failed to load GATC",
        description:
          error instanceof Error
            ? error.message
            : "Could not load GATC profile.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSuspend = async (gatc: GatcListItem) => {
    try {
      await updateStatus(gatc.gatc_id, "SUSPENDED");

      toast({
        title: "GATC suspended",
        description: `${gatc.centre_code} has been suspended.`,
      });
    } catch (error) {
      toast({
        title: "Failed to suspend GATC",
        description:
          error instanceof Error ? error.message : "Something went wrong.",
        variant: "destructive",
      });
    }
  };

  const handleActivate = async (gatc: GatcListItem) => {
    try {
      await updateStatus(gatc.gatc_id, "ACTIVE");

      toast({
        title: "GATC activated",
        description: `${gatc.centre_code} is now active.`,
      });
    } catch (error) {
      toast({
        title: "Failed to activate GATC",
        description:
          error instanceof Error ? error.message : "Something went wrong.",
        variant: "destructive",
      });
    }
  };

  const handleCreateGatc = async () => {
    const payload: CreateGatcPayload = {
      centre_code: "GATC-MH-99",

      approval_cert_no: "CERT-MH-2026-099",

      ind_mark_code: "MH-IND-099",

      valid_from: "2026-09-21T00:00:00.000Z",

      valid_to: "2027-09-20T23:59:59.000Z",

      approved_categories: ["ENERGY_DISPENSING", "WEIGHBRIDGES"],

      lat: 18.5204,
      long: 73.8567,

      principal_officer_id: "REPLACE_WITH_USER_ID",
    };

    try {
      setIsSubmitting(true);

      const created = await createGatc(payload);

      setIsAuthorizeOpen(false);

      toast({
        title: "GATC authorization approved",
        description: `${created.centre_code} was successfully created.`,
      });
    } catch (error) {
      toast({
        title: "Failed to authorize GATC",
        description:
          error instanceof Error ? error.message : "Something went wrong.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DashboardLayout role="admin">
      <section className="mx-auto max-w-330 overflow-hidden rounded-xl border border-[#E0E0E0] bg-white shadow-card">
        {/* Header */}

        <div className="flex flex-col justify-between gap-4 px-4 pb-6 pt-6 sm:flex-row sm:items-center sm:px-7 sm:pt-7">
          <h1 className="text-xl font-bold tracking-tight text-[#1A1A2E] sm:text-2xl">
            GATC Authorization & Revenue Management
          </h1>

          <Button
            onClick={() => setIsAuthorizeOpen(true)}
            className="h-10 w-fit rounded-lg bg-[#FF6F00] px-4 font-bold text-white shadow-none hover:bg-[#E66000]"
          >
            + Authorize New GATC
          </Button>
        </div>

        <div className="border-t border-[#E8E9EC]" />

        <div className="px-4 pb-7 pt-6 sm:px-7">
          {/* KPI CARDS */}

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <KpiCard
              title="Total Active GATCs"
              value={
                loadingDashboard
                  ? "..."
                  : String(dashboard?.totalActiveGatcs ?? 0)
              }
              detail={
                dashboard
                  ? `Across ${dashboard.statesCovered} States & ${dashboard.unionTerritoriesCovered} UTs`
                  : "Loading..."
              }
              tone="blue"
            />

            <KpiCard
              title="GATC Revenue Generated (YTD)"
              value={
                loadingDashboard
                  ? "..."
                  : formatCrore(dashboard?.revenueYtd.total ?? 0)
              }
              detail={
                dashboard
                  ? `Govt: ${formatIndianCurrency(
                      dashboard.revenueYtd.govt_share,
                    )} | GATC: ${formatIndianCurrency(
                      dashboard.revenueYtd.gatc_share,
                    )}`
                  : "Loading..."
              }
              tone="green"
            />

            <KpiCard
              title="Pending Lab Renewals"
              value={
                loadingDashboard
                  ? "..."
                  : `${dashboard?.pendingLabRenewals ?? 0} Labs`
              }
              detail="Licenses expiring in < 30 days"
              tone="amber"
            />
          </div>

          {/* TABLE HEADER */}

          <div className="mt-9 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <h2 className="text-lg font-bold text-[#0B3D91]">
              Authorized Testing Centres Network
            </h2>

            <div className="relative sm:w-77.5">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8A8A98]" />

              <Input
                value={search}
                onChange={(event) => searchGatcs(event.target.value)}
                placeholder="Search by Lab Name, ID, or Category..."
                className="h-10 rounded-lg border-[#E0E0E0] pl-9 text-sm shadow-none hover:border-primary focus-visible:border-primary focus-visible:ring-primary/15"
              />
            </div>
          </div>

          {/* TABLE */}

          <div className="mt-4 overflow-hidden rounded-lg border border-[#E0E0E0]">
            <div className="overflow-x-auto">
              <Table className="mobile-card-table min-w-275">
                <TableHeader>
                  <TableRow className="border-b border-[#E0E0E0] bg-[#F5F7FA] hover:bg-[#F5F7FA]">
                    <TableHead className="h-12 px-5 text-[11px] font-bold uppercase tracking-wide text-[#5C5C70]">
                      GATC ID & Lab Name
                    </TableHead>

                    <TableHead className="h-12 text-[11px] font-bold uppercase tracking-wide text-[#5C5C70]">
                      Authorized Categories
                    </TableHead>

                    <TableHead className="h-12 text-[11px] font-bold uppercase tracking-wide text-[#5C5C70]">
                      License Validity
                    </TableHead>

                    <TableHead className="h-12 text-[11px] font-bold uppercase tracking-wide text-[#5C5C70]">
                      Revenue Split (YTD)
                    </TableHead>

                    <TableHead className="h-12 pr-5 text-[11px] font-bold uppercase tracking-wide text-[#5C5C70]">
                      Action
                    </TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {loadingGatcs ? (
                    <TableRow>
                      <TableCell colSpan={5} className="py-12 text-center">
                        <Loader2 className="mx-auto h-6 w-6 animate-spin text-[#0B3D91]" />

                        <p className="mt-2 text-sm text-[#5C5C70]">
                          Loading GATCs...
                        </p>
                      </TableCell>
                    </TableRow>
                  ) : gatcs.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className="py-12 text-center text-sm text-[#5C5C70]"
                      >
                        No testing centres match your search.
                      </TableCell>
                    </TableRow>
                  ) : (
                    gatcs.map((gatc) => (
                      <GatcRow
                        key={gatc.gatc_id}
                        gatc={gatc}
                        onViewProfile={() => handleViewProfile(gatc)}
                        onSuspend={() => handleSuspend(gatc)}
                        onActivate={() => handleActivate(gatc)}
                        loading={actionLoading || isSubmitting}
                      />
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {/* PAGINATION */}

            <div className="flex flex-col gap-3 border-t border-[#E8E9EC] px-5 py-4 text-sm sm:flex-row sm:items-center sm:justify-between">
              <span className="text-[#5C5C70]">
                {pagination
                  ? `Showing ${
                      pagination.total === 0
                        ? 0
                        : (page - 1) * pagination.limit + 1
                    } to ${Math.min(
                      page * pagination.limit,
                      pagination.total,
                    )} of ${pagination.total} registered GATCs`
                  : "Loading..."}
              </span>

              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  disabled={!pagination || page <= 1 || loadingGatcs}
                  onClick={previousPage}
                  className="h-9 text-sm text-[#5C5C70] hover:text-[#0B3D91]"
                >
                  &lt; Previous
                </Button>

                <Button
                  variant="ghost"
                  disabled={
                    !pagination || page >= pagination.totalPages || loadingGatcs
                  }
                  onClick={nextPage}
                  className="h-9 font-semibold text-[#0B3D91] hover:bg-primary/5"
                >
                  Next &gt;
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* AUTHORIZE GATC DIALOG */}

      <Dialog open={isAuthorizeOpen} onOpenChange={setIsAuthorizeOpen}>
        <DialogContent className="bg-white sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-[#1A1A2E]">
              Authorize New GATC
            </DialogTitle>

            <DialogDescription>
              Create a new authorized testing centre.
            </DialogDescription>
          </DialogHeader>

          <div className="rounded-lg bg-[#FFF3E0] p-4 text-sm text-[#1A1A2E]">
            Connect this dialog to your actual GATC authorization form. The
            backend POST endpoint is already wired through
            <code className="mx-1 rounded bg-white px-1">createGatc()</code>
            in the hook.
          </div>

          <DialogFooter>
            <Button
              variant="ghost"
              disabled={isSubmitting}
              onClick={() => setIsAuthorizeOpen(false)}
              className="text-[#D32F2F]"
            >
              Cancel
            </Button>

            <Button
              disabled={isSubmitting}
              onClick={handleCreateGatc}
              className="bg-[#FF6F00] font-bold text-white shadow-none hover:bg-[#E66000]"
            >
              {isSubmitting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}

              {isSubmitting ? "Creating..." : "Approve & Issue GATC ID"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* PROFILE DIALOG */}

      <Dialog open={isProfileOpen} onOpenChange={setIsProfileOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto bg-white sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-[#1A1A2E]">
              GATC Profile
            </DialogTitle>

            <DialogDescription>
              Detailed information and revenue summary.
            </DialogDescription>
          </DialogHeader>

          {selectedGatc && (
            <div className="grid gap-4 sm:grid-cols-2">
              <ProfileField label="GATC ID" value={selectedGatc.centre_code} />

              <ProfileField label="Lab Name" value={selectedGatc.lab_name} />

              <ProfileField
                label="Approval Certificate"
                value={selectedGatc.approval_cert_no}
              />

              <ProfileField
                label="Ind Mark Code"
                value={selectedGatc.ind_mark_code}
              />

              <ProfileField
                label="Principal Officer"
                value={selectedGatc.principal_officer.name}
              />

              <ProfileField
                label="Officer Email"
                value={selectedGatc.principal_officer.email}
              />

              <ProfileField
                label="Applications"
                value={String(selectedGatc.applications)}
              />

              <ProfileField
                label="Successful Payments"
                value={String(selectedGatc.successfulPayments)}
              />

              <ProfileField
                label="Total Revenue"
                value={formatIndianCurrency(selectedGatc.revenue.total)}
              />

              <ProfileField
                label="Government Share"
                value={formatIndianCurrency(selectedGatc.revenue.govt_share)}
              />

              <ProfileField
                label="GATC Share"
                value={formatIndianCurrency(selectedGatc.revenue.gatc_share)}
              />

              <ProfileField
                label="Inspections"
                value={String(selectedGatc.inspections)}
              />

              <ProfileField
                label="Passed Inspections"
                value={String(selectedGatc.passedInspections)}
              />

              <ProfileField
                label="Failed Inspections"
                value={String(selectedGatc.failedInspections)}
              />

              <div className="sm:col-span-2">
                <p className="text-xs font-bold uppercase tracking-wide text-[#5C5C70]">
                  Authorized Categories
                </p>

                <p className="mt-1 text-sm font-semibold text-[#1A1A2E]">
                  {selectedGatc.approved_categories.join(", ")}
                </p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              onClick={() => setIsProfileOpen(false)}
              className="bg-[#0B3D91] text-white hover:bg-[#083276]"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}

function GatcRow({
  gatc,
  onViewProfile,
  onSuspend,
  onActivate,
  loading,
}: {
  gatc: GatcListItem;
  onViewProfile: () => void;
  onSuspend: () => void;
  onActivate: () => void;
  loading: boolean;
}) {
  const validity = getValidity(gatc);

  const validityClassName =
    validity.tone === "valid"
      ? "bg-[#1E8E3E] text-white"
      : validity.tone === "expiring"
        ? "bg-[#F9A825] text-[#1A1A2E]"
        : "bg-[#D32F2F] text-white";

  return (
    <TableRow className="border-b border-[#E8E9EC] hover:bg-[#FAFBFC]">
      <TableCell className="px-5 py-5 align-top">
        <p className="font-semibold text-[#1A1A2E]">{gatc.centre_code}</p>

        <p className="mt-1 text-sm font-bold text-[#0B3D91]">{gatc.lab_name}</p>
      </TableCell>

      <TableCell className="max-w-77.5 py-5 align-top text-sm leading-5 text-[#1A1A2E]">
        {gatc.approved_categories.join(", ")}
      </TableCell>

      <TableCell className="py-5 align-top">
        <span
          className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-bold ${validityClassName}`}
        >
          {validity.label}
        </span>

        <p
          className={`mt-2 whitespace-nowrap text-xs ${
            validity.tone === "expiring"
              ? "font-medium text-[#D32F2F]"
              : "text-[#5C5C70]"
          }`}
        >
          {validity.note}
        </p>
      </TableCell>

      <TableCell className="py-5 align-top">
        <p className="font-bold text-[#1A1A2E]">
          Total: {formatIndianCurrency(gatc.revenue.total)}
        </p>

        <p className="mt-1 text-xs text-[#5C5C70]">
          Govt: {formatIndianCurrency(gatc.revenue.govt_share)} | GATC:{" "}
          {formatIndianCurrency(gatc.revenue.gatc_share)}
        </p>
      </TableCell>

      <TableCell className="pr-5 py-5 align-top">
        {gatc.status === "SUSPENDED" ? (
          <Button
            variant="ghost"
            disabled={loading}
            onClick={onActivate}
            className="h-9 whitespace-nowrap px-2 text-xs font-semibold text-[#0B3D91] hover:bg-primary/5"
          >
            Activate
          </Button>
        ) : (
          <div className="flex flex-col items-start gap-1">
            <Button
              variant="ghost"
              disabled={loading}
              onClick={onViewProfile}
              className="h-9 whitespace-nowrap px-2 text-xs font-semibold text-[#0B3D91] hover:bg-primary/5"
            >
              View Profile
            </Button>

            {gatc.status === "ACTIVE" && (
              <Button
                variant="ghost"
                disabled={loading}
                onClick={onSuspend}
                className="h-8 whitespace-nowrap px-2 text-xs font-semibold text-[#D32F2F] hover:bg-[#FFEBEE]"
              >
                Suspend
              </Button>
            )}
          </div>
        )}
      </TableCell>
    </TableRow>
  );
}

function ProfileField({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-[#E8E9EC] p-3">
      <p className="text-xs font-bold uppercase tracking-wide text-[#5C5C70]">
        {label}
      </p>

      <p className="mt-1 text-sm font-semibold text-[#1A1A2E]">{value}</p>
    </div>
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
  let toneClass = "text-[#F9A825]";

  if (tone === "blue") {
    toneClass = "text-[#0B3D91]";
  } else if (tone === "green") {
    toneClass = "text-[#1E8E3E]";
  }

  return (
    <div className="rounded-lg border border-[#E0E0E0] bg-white p-4 shadow-card">
      <p className="text-sm font-medium text-[#5C5C70]">{title}</p>

      <p className={`mt-3 text-2xl font-extrabold tracking-tight ${toneClass}`}>
        {value}
      </p>

      <p className="mt-2 min-h-10 text-xs leading-5 text-[#5C5C70]">{detail}</p>
    </div>
  );
}

function formatIndianCurrency(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatCrore(amount: number) {
  const crore = amount;

  if (crore >= 1) {
    return `₹${crore.toFixed(1)}`;
  }

  return formatIndianCurrency(amount);
}

function getValidity(gatc: GatcListItem) {
  const expiry = new Date(gatc.valid_to);

  const now = new Date();

  const daysRemaining = Math.ceil(
    (expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
  );

  if (gatc.status === "SUSPENDED") {
    return {
      label: "Suspended",
      tone: "suspended" as const,
      note: `Expires: ${formatDate(expiry)}`,
    };
  }

  if (gatc.status === "REVOKED") {
    return {
      label: "Revoked",
      tone: "suspended" as const,
      note: `Expires: ${formatDate(expiry)}`,
    };
  }

  if (daysRemaining <= 30) {
    return {
      label: "Expiring Soon",
      tone: "expiring" as const,
      note: `Expires: ${formatDate(expiry)}`,
    };
  }

  return {
    label: "Valid",
    tone: "valid" as const,
    note: `Expires: ${formatDate(expiry)}`,
  };
}

function formatDate(date: Date) {
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}
