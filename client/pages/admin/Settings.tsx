import { useState } from "react";
import { Check, Lock } from "lucide-react";
import { DashboardLayout } from "@/components/emaap/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const readOnlyClass = "h-10 rounded-lg border-[#E0E0E0] bg-[#F8F9FB] text-sm text-[#1A1A2E] shadow-none";

export default function AdminSettings() {
  const [autoRoute, setAutoRoute] = useState(true);
  const [offlineSync, setOfflineSync] = useState(true);
  const [auditTrail, setAuditTrail] = useState(true);
  const [intranetOnly, setIntranetOnly] = useState(false);

  return (
    <DashboardLayout role="admin">
      <section className="mx-auto max-w-[1120px] rounded-xl border border-[#E0E0E0] bg-white shadow-card">
        <div className="px-4 pb-6 pt-6 sm:px-9 sm:pt-7">
          <h1 className="text-xl font-bold tracking-tight text-[#1A1A2E] sm:text-2xl">
            Administrator Settings &amp; System Preferences
          </h1>
        </div>
        <div className="border-t border-[#E8E9EC]" />

        <div className="space-y-9 px-4 pb-8 pt-7 sm:px-9">
          <div className="flex flex-col gap-5 rounded-lg bg-[#F5F7FA] p-4 sm:flex-row sm:items-center">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-[#0B3D91] text-xl font-bold text-white">AC</div>
            <div className="min-w-0 flex-1">
              <h2 className="text-lg font-bold text-[#1A1A2E]">Dr. Rajesh Kumar</h2>
              <p className="mt-1 text-sm leading-5 text-[#5C5C70]">
                Designation: Joint Controller, Legal Metrology • Jurisdiction: Central Command (New Delhi)
              </p>
            </div>
            <span className="w-fit rounded-full bg-[#1E8E3E] px-3 py-1.5 text-xs font-bold text-white">SuperAdmin Access</span>
          </div>

          <section>
            <h3 className="text-base font-bold text-[#0B3D91]">Officer Identity Details</h3>
            <p className="mt-1 text-sm text-[#5C5C70]">Linked with Government e-Directory (NIC). To update these details, contact the central HRMS portal.</p>
            <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2">
              <ReadOnlyField label="Govt Employee ID" value="EMP-LM-2015-8821" />
              <ReadOnlyField label="Department" value="Dept. of Consumer Affairs (DoCA)" />
              <ReadOnlyField label="Official Email" value="rajesh.kumar.lm@nic.in" />
              <div className="flex flex-col gap-2">
                <Label className="text-sm font-bold text-[#5C5C70]">Authorized Digital Signature</Label>
                <div className="relative">
                  <Input readOnly value="Valid (Expires: 12-Dec-2028)" className={`${readOnlyClass} pr-10`} />
                  <Check className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#1E8E3E]" strokeWidth={3} />
                </div>
              </div>
            </div>
          </section>

          <section>
            <h3 className="text-base font-bold text-[#0B3D91]">Workflow Engine Configurations</h3>
            <p className="mt-1 text-sm text-[#5C5C70]">Configure the parameters for the automated Legal Metrology Officer (LMO) and GATC task allocation system.</p>
            <div className="mt-5 grid grid-cols-1 gap-5 rounded-lg border border-[#E0E0E0] p-5 md:grid-cols-2">
              <div className="flex flex-col gap-2">
                <Label className="text-sm font-bold text-[#5C5C70]">SLA Breach Threshold</Label>
                <select className="h-10 rounded-lg border border-[#E0E0E0] bg-white px-3 text-sm text-[#1A1A2E] outline-none hover:border-primary focus:border-primary">
                  <option>15 Days</option><option>10 Days</option><option>20 Days</option>
                </select>
              </div>
              <PreferenceToggle label="Auto-route to private GATC if LMO SLA is breached." checked={autoRoute} onCheckedChange={setAutoRoute} />
              <div className="flex flex-col gap-2">
                <Label className="text-sm font-bold text-[#5C5C70]">Default Geographic Radius for Assignment</Label>
                <select className="h-10 rounded-lg border border-[#E0E0E0] bg-white px-3 text-sm text-[#1A1A2E] outline-none hover:border-primary focus:border-primary">
                  <option>50 km</option><option>25 km</option><option>100 km</option>
                </select>
              </div>
              <PreferenceToggle label="Enable Offline-Sync mode for Field Officer Mobile App." checked={offlineSync} onCheckedChange={setOfflineSync} />
            </div>
          </section>

          <section>
            <h3 className="text-base font-bold text-[#0B3D91]">System Security &amp; Compliance</h3>
            <div className="mt-3 rounded-lg border border-[#E0E0E0] px-4">
              <div className="flex items-center justify-between gap-5 border-b border-[#E8E9EC] py-4">
                <span className="flex items-center gap-2 text-sm text-[#1A1A2E]">Mandatory Two-Factor Authentication (OTP) for all LMO Logins <Lock className="h-3.5 w-3.5 text-[#5C5C70]" /></span>
                <Toggle checked label="Mandatory Two-Factor Authentication" onCheckedChange={() => undefined} disabled />
              </div>
              <PreferenceToggle label="Log all administrative state-transitions to immutable Audit Trail" checked={auditTrail} onCheckedChange={setAuditTrail} />
              <PreferenceToggle label="Restrict portal access to government intranet IP ranges only" checked={intranetOnly} onCheckedChange={setIntranetOnly} />
            </div>
          </section>

          <div className="flex flex-col-reverse items-stretch justify-end gap-3 border-t border-[#E8E9EC] pt-6 sm:flex-row sm:items-center">
            <Button variant="ghost" className="font-semibold text-[#5C5C70] hover:bg-muted hover:text-[#1A1A2E]">Cancel</Button>
            <Button className="h-10 rounded-lg bg-[#0B3D91] px-5 font-bold text-white shadow-none hover:bg-[#082F70]">Update System Preferences</Button>
          </div>
        </div>
      </section>
    </DashboardLayout>
  );
}

function PreferenceToggle({ label, checked, onCheckedChange }: { label: string; checked: boolean; onCheckedChange: (checked: boolean) => void }) {
  return (
    <div className="flex min-h-10 items-center justify-between gap-5">
      <span className="text-sm leading-5 text-[#1A1A2E]">{label}</span>
      <Toggle checked={checked} onCheckedChange={onCheckedChange} label={label} />
    </div>
  );
}

function Toggle({ checked, onCheckedChange, label, disabled = false }: { checked: boolean; onCheckedChange: (checked: boolean) => void; label: string; disabled?: boolean }) {
  return (
    <button type="button" role="switch" aria-checked={checked} aria-label={label} disabled={disabled} onClick={() => onCheckedChange(!checked)} className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70 ${checked ? "bg-[#1E8E3E]" : "bg-[#D9DCE2]"}`}>
      <span className={`pointer-events-none block h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${checked ? "translate-x-5" : "translate-x-0"}`} />
    </button>
  );
}

function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return <div className="flex flex-col gap-2"><Label className="text-sm font-bold text-[#5C5C70]">{label}</Label><Input readOnly value={value} className={readOnlyClass} /></div>;
}
