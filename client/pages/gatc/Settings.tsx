import { Check } from "lucide-react";
import { useState } from "react";
import { DashboardLayout } from "@/components/emaap/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useGatcSettings } from "@/hooks/useGatc";

const getInitials = (name: string) => {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
};

const formatDate = (value: string) => {
  return new Date(value).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const ReadOnlyField = ({ label, value }: { label: string; value: string }) => {
  return (
    <div className="flex flex-col gap-2">
      <Label className="text-sm font-bold text-[#5C5C70]">{label}</Label>
      <Input
        readOnly
        value={value || "—"}
        className="h-10 rounded-lg border-[#E0E0E0] bg-[#F8F9FB] text-sm text-[#1A1A2E] shadow-none"
      />
    </div>
  );
};

export default function GatcSettings() {
  const { data, isLoading, isError } = useGatcSettings();
  const [assignmentAlerts, setAssignmentAlerts] = useState(true);
  const [revenueAlerts, setRevenueAlerts] = useState(true);

  if (isLoading) {
    return (
      <DashboardLayout role="gatc">
        <div className="flex min-h-125 items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      </DashboardLayout>
    );
  }

  if (isError || !data) {
    return (
      <DashboardLayout role="gatc">
        <div className="flex min-h-125 items-center justify-center text-sm text-muted-foreground">
          Unable to load GATC settings.
        </div>
      </DashboardLayout>
    );
  }

  const principalVerified =
    data.principal.email_verified && data.principal.mobile_verified;

  const initials = getInitials(data.principal.full_name);

  return (
    <DashboardLayout role="gatc">
      <section className="mx-auto max-w-280 rounded-xl border border-[#E0E0E0] bg-white shadow-card">
        <div className="px-4 pb-6 pt-6 sm:px-9 sm:pt-7">
          <h1 className="text-xl font-bold tracking-tight text-[#1A1A2E] sm:text-2xl">
            Settings &amp; Corporate Profile
          </h1>
        </div>
        <div className="border-t border-[#E8E9EC]" />

        <div className="space-y-9 px-4 pb-8 pt-7 sm:px-9">
          <div className="flex flex-col gap-5 rounded-lg bg-[#F5F7FA] p-4 sm:flex-row sm:items-center">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-[#0B3D91] text-xl font-bold text-white">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-lg font-bold text-[#1A1A2E]">
                {data.principal.full_name}
              </h2>
              <p className="mt-1 flex flex-wrap items-center gap-x-1.5 text-sm text-[#5C5C70]">
                <span>Registered email: {data.principal.email}</span>
                <span className="hidden text-[#B1B4BC] sm:inline">•</span>
                <span className="inline-flex items-center gap-1 font-medium text-[#1E8E3E]">
                  Status:{" "}
                  {principalVerified
                    ? "Contact Verified"
                    : "Verification Pending"}
                  {principalVerified && (
                    <Check className="h-3.5 w-3.5" strokeWidth={3} />
                  )}
                </span>
              </p>
            </div>
            <Button
              variant="ghost"
              className="w-fit font-semibold text-[#0B3D91] hover:bg-primary/5 hover:text-[#0B3D91]"
            >
              Edit Profile
            </Button>
          </div>

          <section>
            <h3 className="text-base font-bold text-[#0B3D91]">
              Principal Officer Details
            </h3>
            <p className="mt-1 text-sm text-[#5C5C70]">
              Official contact details for the GATC principal officer.
            </p>
            <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-3">
              <ReadOnlyField
                label="Full Name"
                value={data.principal.full_name}
              />
              <ReadOnlyField
                label="Registered Email"
                value={data.principal.email}
              />
              <ReadOnlyField
                label="Mobile Number"
                value={data.principal.mobile}
              />
            </div>
          </section>

          <section>
            <h3 className="text-base font-bold text-[#0B3D91]">
              GATC Centre Details
            </h3>
            <p className="mt-1 text-sm text-[#5C5C70]">
              Registered details and validity for the approved test centre.
            </p>
            <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
              <ReadOnlyField
                label="Centre Code"
                value={data.gatc.centre_code}
              />
              <ReadOnlyField
                label="Approval Certificate No."
                value={data.gatc.approval_cert_no}
              />
              <ReadOnlyField
                label="IND Mark Code"
                value={data.gatc.ind_mark_code}
              />
              <ReadOnlyField
                label="Valid From"
                value={formatDate(data.gatc.valid_from)}
              />
              <ReadOnlyField
                label="Valid To"
                value={formatDate(data.gatc.valid_to)}
              />
              <ReadOnlyField label="Centre Status" value={data.gatc.status} />
            </div>
          </section>

          <section>
            <h3 className="text-base font-bold text-[#0B3D91]">
              Alerts &amp; Notifications
            </h3>
            <p className="mt-1 text-sm text-[#5C5C70]">
              Notification preferences for the GATC portal.
            </p>
            <div className="mt-2 rounded-lg border border-[#E0E0E0] px-4">
              <PreferenceToggle
                label="New Application Assignment Alerts"
                checked={assignmentAlerts}
                onCheckedChange={setAssignmentAlerts}
              />
              <PreferenceToggle
                label="Revenue Deposit Alerts"
                checked={revenueAlerts}
                onCheckedChange={setRevenueAlerts}
              />
            </div>
          </section>

          <div className="flex flex-col-reverse items-stretch justify-end gap-3 border-t border-[#E8E9EC] pt-6 sm:flex-row sm:items-center">
            <Button
              variant="ghost"
              className="font-semibold text-[#5C5C70] hover:bg-muted hover:text-[#1A1A2E]"
            >
              Cancel
            </Button>
            <Button className="h-10 rounded-lg bg-[#0B3D91] px-5 font-bold text-white shadow-none hover:bg-[#082F70]">
              Save Preferences
            </Button>
          </div>
        </div>
      </section>
    </DashboardLayout>
  );
}

function PreferenceToggle({
  label,
  checked,
  onCheckedChange,
}: {
  label: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-5 border-b border-[#E8E9EC] py-4 last:border-b-0">
      <span className="text-sm text-[#1A1A2E]">{label}</span>
      <Toggle
        checked={checked}
        onCheckedChange={onCheckedChange}
        label={label}
      />
    </div>
  );
}

function Toggle({
  checked,
  onCheckedChange,
  label,
}: {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onCheckedChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
        checked ? "bg-[#1E8E3E]" : "bg-[#D9DCE2]"
      }`}
    >
      <span
        className={`pointer-events-none block h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
          checked ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  );
}
