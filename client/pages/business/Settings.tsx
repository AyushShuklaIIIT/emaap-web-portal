import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { DashboardLayout } from "@/components/emaap/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const readOnlyFieldClass =
  "h-10 rounded-lg border-[#E0E0E0] bg-[#F8F9FB] text-sm text-[#1A1A2E] shadow-none";

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

export default function BusinessSettings() {
  const [webhookEnabled, setWebhookEnabled] = useState(true);
  const [expiryAlerts, setExpiryAlerts] = useState(true);
  const [inspectionUpdates, setInspectionUpdates] = useState(true);
  const [monthlyReports, setMonthlyReports] = useState(false);

  return (
    <DashboardLayout role="business">
      <section className="mx-auto max-w-[1120px] rounded-xl border border-[#E0E0E0] bg-white shadow-card">
        <div className="px-7 pb-6 pt-7 sm:px-9">
          <h1 className="text-2xl font-bold tracking-tight text-[#1A1A2E]">
            Settings &amp; Corporate Profile
          </h1>
        </div>
        <div className="border-t border-[#E8E9EC]" />

        <div className="space-y-9 px-7 pb-8 pt-7 sm:px-9">
          <div className="flex flex-col gap-5 rounded-lg bg-[#F5F7FA] p-4 sm:flex-row sm:items-center">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-[#0B3D91] text-xl font-bold text-white">
              RR
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-lg font-bold text-[#1A1A2E]">Reliance Retail Ltd.</h2>
              <p className="mt-1 flex flex-wrap items-center gap-x-1.5 text-sm text-[#5C5C70]">
                <span>Corporate ID (CIN): L01100GJ1999PLC036018</span>
                <span className="hidden text-[#B1B4BC] sm:inline">•</span>
                <span className="inline-flex items-center gap-1 font-medium text-[#1E8E3E]">
                  Status: KYC Verified <Check className="h-3.5 w-3.5" strokeWidth={3} />
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
              Nominated Director under Legal Metrology Act
            </h3>
            <p className="mt-1 text-sm text-[#5C5C70]">
              As per Sec 49 of the LM Act, this individual is officially responsible for metrological compliance.
            </p>
            <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2">
              <ReadOnlyField label="Director Name" value="Vikram Sharma" />
              <ReadOnlyField label="Director Identification Number (DIN)" value="08341209" />
              <ReadOnlyField label="Registered Email" value="compliance@relianceretail.com" />
              <ReadOnlyField label="Mobile Number" value="+91-9892012345" />
            </div>
          </section>

          <section>
            <h3 className="text-base font-bold text-[#0B3D91]">API &amp; ERP Connectivity</h3>
            <p className="mt-1 text-sm text-[#5C5C70]">
              Connect your SAP/Oracle ERP system to automatically fetch digital certificates and sync renewal dates.
            </p>
            <div className="mt-5 flex flex-col gap-4 rounded-lg border border-[#E0E0E0] bg-white p-4 sm:flex-row sm:items-end">
              <div className="flex-1">
                <Label htmlFor="api-key" className="text-sm font-bold text-[#5C5C70]">
                  Live API Key
                </Label>
                <Input
                  id="api-key"
                  readOnly
                  value="eMaap-prod-••••••••••••••••"
                  className="mt-2 h-10 rounded-lg border-[#E0E0E0] bg-[#F8F9FB] text-sm text-[#1A1A2E] shadow-none"
                />
              </div>
              <Button
                type="button"
                variant="outline"
                className="h-10 w-fit gap-2 border-[#E0E0E0] text-[#0B3D91] hover:bg-primary/5 hover:text-[#0B3D91]"
              >
                <Copy className="h-4 w-4" /> Copy
              </Button>
              <Button className="h-10 w-fit rounded-lg bg-[#FF6F00] font-bold text-white shadow-none hover:bg-[#E66000]">
                Regenerate Key
              </Button>
            </div>
            <div className="mt-4 flex items-center justify-between gap-4">
              <span className="text-sm text-[#1A1A2E]">Enable Webhook Notifications for Status Changes</span>
              <Toggle
                checked={webhookEnabled}
                onCheckedChange={setWebhookEnabled}
                label="Enable Webhook Notifications for Status Changes"
              />
            </div>
          </section>

          <section>
            <h3 className="text-base font-bold text-[#0B3D91]">Alerts &amp; Notifications</h3>
            <div className="mt-2 rounded-lg border border-[#E0E0E0] px-4">
              <PreferenceToggle
                label="Certificate Expiry Alerts (SMS & Email 60, 30, and 7 days prior)"
                checked={expiryAlerts}
                onCheckedChange={setExpiryAlerts}
              />
              <PreferenceToggle
                label="Field Inspection Scheduling Updates"
                checked={inspectionUpdates}
                onCheckedChange={setInspectionUpdates}
              />
              <PreferenceToggle
                label="Monthly Compliance Summary Reports"
                checked={monthlyReports}
                onCheckedChange={setMonthlyReports}
              />
            </div>
          </section>

          <div className="flex flex-col-reverse items-stretch justify-end gap-3 border-t border-[#E8E9EC] pt-6 sm:flex-row sm:items-center">
            <Button variant="ghost" className="font-semibold text-[#5C5C70] hover:bg-muted hover:text-[#1A1A2E]">
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

function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-2">
      <Label className="text-sm font-bold text-[#5C5C70]">{label}</Label>
      <Input readOnly value={value} className={readOnlyFieldClass} />
    </div>
  );
}
