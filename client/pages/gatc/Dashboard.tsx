import { FormEvent, useState } from "react";
import { Check, ChevronLeft, ChevronRight, UploadCloud } from "lucide-react";
import { DashboardLayout } from "@/components/emaap/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const scopeCategories = [
  "Energy Dispensers (CNG, LNG, Petrol)",
  "Automatic Rail Weighbridges",
  "Clinical Thermometers",
  "Standard Weights",
  "Non-Automatic Weighing Instruments",
  "Automatic Weighing Instruments",
  "Vehicle Weighbridges",
  "Platform Scales",
  "Retail Weighing Scales",
  "Industrial Weighing Systems",
  "Flow Meters",
  "Water Meters",
  "Fuel Dispensers",
  "Gas Cylinders",
  "Pressure Gauges",
  "Temperature Sensors",
  "Length Measuring Instruments",
  "Area Measuring Instruments",
  "Volume Measures",
  "Tanker Trucks",
  "Taxi Meters",
  "Clinical Sphygmomanometers",
  "Weights and Measures Software",
];

const initialScope = [
  "Energy Dispensers (CNG, LNG, Petrol)",
  "Automatic Rail Weighbridges",
  "Clinical Thermometers",
  "Standard Weights",
];

export default function GatcDashboard() {
  const [appStatus, setAppStatus] = useState<"unauthorized" | "pending">(
    "unauthorized",
  );
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedScope, setSelectedScope] = useState(initialScope);

  const toggleScope = (category: string) => {
    setSelectedScope((current) =>
      current.includes(category)
        ? current.filter((item) => item !== category)
        : [...current, category],
    );
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    window.setTimeout(() => {
      setIsLoading(false);
      setAppStatus("pending");
    }, 1500);
  };

  return (
    <DashboardLayout role="gatc">
      {appStatus === "unauthorized" ? (
        <ApplicationWizard
          step={step}
          setStep={setStep}
          isLoading={isLoading}
          selectedScope={selectedScope}
          toggleScope={toggleScope}
          onSubmit={handleSubmit}
        />
      ) : (
        <PendingStatus />
      )}
    </DashboardLayout>
  );
}

function ApplicationWizard({
  step,
  setStep,
  isLoading,
  selectedScope,
  toggleScope,
  onSubmit,
}: Readonly<{
  step: number;
  setStep: (step: number) => void;
  isLoading: boolean;
  selectedScope: string[];
  toggleScope: (category: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}>) {
  return (
    <section className="mx-auto max-w-270 rounded-xl border border-[#E0E0E0] bg-white shadow-card">
      <div className="border-b border-[#E8E9EC] px-5 py-6 sm:px-8">
        <p className="text-xs font-bold uppercase tracking-widest text-[#FF6F00]">
          Legal Metrology Compliance Portal
        </p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-[#1A1A2E]">
          GATC Recognition Application &amp; Onboarding
        </h1>
        <p className="mt-2 text-sm text-[#5C5C70]">
          Apply for recognition as a Government Approved Test Centre under the
          GATC Rules, 2013 and 2026 amendments.
        </p>
      </div>
      <div className="grid grid-cols-3 border-b border-[#E8E9EC] bg-[#F5F7FA] px-5 sm:px-8">
        {[
          [1, "Lab Details"],
          [2, "Technical Infrastructure"],
          [3, "Scope & Submission"],
        ].map(([number, label]) => (
          <div
            key={number}
            className={`relative flex items-center gap-2 border-b-2 px-1 py-4 text-xs font-bold sm:gap-3 sm:text-sm ${step >= Number(number) ? "border-[#0B3D91] text-[#0B3D91]" : "border-transparent text-[#8A8A98]"}`}
          >
            <span
              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs ${step > Number(number) ? "bg-[#1E8E3E] text-white" : step === Number(number) ? "bg-[#0B3D91] text-white" : "bg-[#E0E0E0] text-[#5C5C70]"}`}
            >
              {step > Number(number) ? <Check className="h-4 w-4" /> : number}
            </span>
            <span className="hidden sm:inline">{label}</span>
          </div>
        ))}
      </div>
      <form onSubmit={onSubmit} className="px-5 py-6 sm:px-8 sm:py-8">
        {step === 1 && <OrganizationStep />}
        {step === 2 && <InfrastructureStep />}
        {step === 3 && (
          <ScopeStep selectedScope={selectedScope} toggleScope={toggleScope} />
        )}
        <div className="mt-8 flex flex-col-reverse justify-between gap-3 border-t border-[#E8E9EC] pt-5 sm:flex-row">
          <Button
            type="button"
            variant="ghost"
            disabled={step === 1 || isLoading}
            onClick={() => setStep(step - 1)}
            className="gap-2 text-[#0B3D91] hover:bg-[#E3F2FD]"
          >
            <ChevronLeft className="h-4 w-4" /> Previous
          </Button>
          {step < 3 ? (
            <Button
              type="button"
              onClick={() => setStep(step + 1)}
              className="gap-2 bg-[#0B3D91] font-bold text-white hover:bg-[#082f70]"
            >
              Continue <ChevronRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              type="submit"
              disabled={isLoading || selectedScope.length === 0}
              className="bg-[#FF6F00] font-bold text-white shadow-none hover:bg-[#E66000]"
            >
              {isLoading
                ? "Submitting Application..."
                : "Submit Application & Pay Processing Fee"}
            </Button>
          )}
        </div>
      </form>
    </section>
  );
}

function OrganizationStep() {
  return (
    <StepSection
      title="Organization & Principal Officer"
      description="Provide the legal identity and qualified officer responsible for the testing centre."
    >
      <div className="grid gap-5 md:grid-cols-2">
        <SelectField
          label="Organization Type"
          name="organizationType"
          options={[
            "Private Laboratory",
            "Engineering College",
            "ITI",
            "Polytechnic",
          ]}
        />
        <Field
          label="Registered Laboratory Name"
          name="laboratoryName"
          required
        />
        <div className="md:col-span-2">
          <Field label="Registered Address" name="address" required />
        </div>
        <Field label="Principal Officer Name" name="officerName" required />
        <SelectField
          label="Highest Qualification"
          name="qualification"
          options={[
            "M.Sc Physics",
            "B.Tech",
            "B.Sc Physics",
            "Diploma in Metrology",
          ]}
        />
        <div>
          <Field
            label="Years of Metrology Experience"
            name="experience"
            type="number"
            min={3}
            required
          />
          <p className="mt-1.5 text-xs text-[#5C5C70]">
            Minimum 3 years required by law.
          </p>
        </div>
      </div>
    </StepSection>
  );
}

function InfrastructureStep() {
  return (
    <StepSection
      title="Technical Infrastructure & Traceability"
      description="Upload current evidence for accreditation, equipment traceability, and lawful premises use."
    >
      <div className="grid gap-5 md:grid-cols-3">
        <FileField
          label="NABL Accreditation Certificate"
          name="nablCertificate"
        />
        <FileField
          label="Equipment Calibration Traceability Proof"
          name="traceabilityProof"
        />
        <FileField
          label="Premises Ownership / Lease Agreement"
          name="premisesAgreement"
        />
      </div>
    </StepSection>
  );
}

function ScopeStep({
  selectedScope,
  toggleScope,
}: Readonly<{
  selectedScope: string[];
  toggleScope: (category: string) => void;
}>) {
  return (
    <StepSection
      title="Requested Scope of Authorization (2026 Rules)"
      description="Select every category for which your laboratory seeks authorization. The final scope will be assessed during joint inspection."
    >
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {scopeCategories.map((category) => (
          <label
            key={category}
            className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 text-sm transition-colors ${selectedScope.includes(category) ? "border-[#0B3D91] bg-[#E3F2FD] text-[#0B3D91]" : "border-[#E0E0E0] text-[#1A1A2E] hover:border-[#8A8A98]"}`}
          >
            <input
              type="checkbox"
              checked={selectedScope.includes(category)}
              onChange={() => toggleScope(category)}
              className="mt-0.5 h-4 w-4 accent-[#0B3D91]"
            />
            <span>{category}</span>
          </label>
        ))}
      </div>
      <p className="mt-4 text-xs text-[#5C5C70]">
        {selectedScope.length} authorization categories selected.
      </p>
    </StepSection>
  );
}

function PendingStatus() {
  const timeline = [
    ["Application Submitted", "Green/Done"],
    ["Document Verification", "Green/Done"],
    [
      "Mandatory Joint Inspection by State & Central Authorities",
      "Amber/In-Progress",
    ],
    ["Final Administrator Approval", "Gray/Pending"],
  ] as const;
  return (
    <section className="mx-auto max-w-270 space-y-6">
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-[#FF6F00]">
          Track Application
        </p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-[#1A1A2E]">
          Application Status: Pending Joint Inspection
        </h1>
      </div>
      <div className="rounded-xl border border-[#E0E0E0] bg-white p-5 shadow-card sm:p-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-[#0B3D91]">
              GATC Recognition Application
            </p>
            <p className="mt-1 text-xs text-[#5C5C70]">
              Application ID: GATC-APP-2026-0917
            </p>
          </div>
          <span className="rounded-full bg-[#FFF8E1] px-3 py-1.5 text-xs font-bold text-[#F9A825]">
            Pending Review
          </span>
        </div>
        <div className="space-y-7">
          {timeline.map(([label, status], index) => {
            const done = index < 2;
            const active = index === 2;
            return (
              <div key={label} className="relative flex gap-4">
                {index < timeline.length - 1 && (
                  <span
                    className={`absolute left-3.5 top-8 h-full w-0.5 ${done ? "bg-[#1E8E3E]" : "bg-[#E0E0E0]"}`}
                  />
                )}
                <span
                  className={`z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${done ? "bg-[#1E8E3E] text-white" : active ? "bg-[#F9A825] text-white" : "bg-[#E0E0E0] text-[#5C5C70]"}`}
                >
                  {done ? <Check className="h-4 w-4" /> : index + 1}
                </span>
                <div className="pb-1">
                  <p className="font-bold text-[#1A1A2E]">{label}</p>
                  <p
                    className={`mt-1 text-xs font-semibold ${done ? "text-[#1E8E3E]" : active ? "text-[#F9A825]" : "text-[#8A8A98]"}`}
                  >
                    {status}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <div className="flex items-start gap-3 rounded-lg bg-[#E3F2FD] p-4 text-sm leading-6 text-[#0B3D91]">
        <UploadCloud className="mt-1 h-5 w-5 shrink-0" />
        <p>
          Your application has been forwarded to the Director of Legal
          Metrology. A physical joint inspection of your premises will be
          scheduled shortly.
        </p>
      </div>
    </section>
  );
}

function StepSection({
  title,
  description,
  children,
}: Readonly<{
  title: string;
  description: string;
  children: React.ReactNode;
}>) {
  return (
    <section>
      <h2 className="text-lg font-bold text-[#0B3D91]">{title}</h2>
      <p className="mt-1 text-sm text-[#5C5C70]">{description}</p>
      <div className="mt-6">{children}</div>
    </section>
  );
}
function Field({
  label,
  name,
  type = "text",
  min,
  required = false,
}: Readonly<{
  label: string;
  name: string;
  type?: string;
  min?: number;
  required?: boolean;
}>) {
  return (
    <label className="block text-sm font-semibold text-[#1A1A2E]">
      {label}
      <Input
        name={name}
        type={type}
        min={min}
        required={required}
        className="mt-2 h-10 rounded-lg border-[#E0E0E0] shadow-none"
      />
    </label>
  );
}
function SelectField({
  label,
  name,
  options,
}: Readonly<{
  label: string;
  name: string;
  options: string[];
}>) {
  return (
    <label className="block text-sm font-semibold text-[#1A1A2E]">
      {label}
      <select
        name={name}
        required
        className="mt-2 flex h-10 w-full rounded-lg border border-[#E0E0E0] bg-white px-3 text-sm font-normal outline-none focus:border-[#0B3D91]"
      >
        <option value="">Select an option</option>
        {options.map((option) => (
          <option key={option}>{option}</option>
        ))}
      </select>
    </label>
  );
}
function FileField({ label, name }: Readonly<{ label: string; name: string }>) {
  return (
    <label className="block rounded-lg border border-dashed border-[#8A8A98] bg-[#F5F7FA] p-4 text-sm font-semibold text-[#1A1A2E]">
      {label}
      <Input
        name={name}
        type="file"
        required
        className="mt-3 h-11 bg-white py-2 text-xs shadow-none"
      />
    </label>
  );
}
