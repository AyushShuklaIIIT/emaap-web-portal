import { DashboardLayout } from "@/components/emaap/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const steps = [
  "Instrument Details",
  "Location & Documents",
  "Review & Payment",
];

function FormField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <Label className="text-sm font-bold text-[#5C5C70]">{label}</Label>
      {children}
    </div>
  );
}

const fieldClassName =
  "h-11 rounded-lg border-[#E0E0E0] bg-white text-sm text-[#1A1A2E] shadow-none transition-colors placeholder:text-[#8A8A98] hover:border-primary focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/15";

export default function NewApplication() {
  return (
    <DashboardLayout role="business">
      <section className="mx-auto max-w-[1120px] rounded-xl border border-[#E0E0E0] bg-white shadow-card">
        <div className="px-8 pb-7 pt-8 sm:px-10">
          <h1 className="text-2xl font-bold tracking-tight text-[#1A1A2E]">
            New Verification Application
          </h1>

          <div className="mt-8 flex items-start">
            {steps.map((step, index) => {
              const active = index === 0;
              return (
                <div
                  key={step}
                  className="flex min-w-0 flex-1 items-start last:flex-none"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                        active
                          ? "bg-[#0B3D91] text-white"
                          : "bg-[#EEF0F3] text-[#7B7F89]"
                      }`}
                    >
                      {index + 1}
                    </div>
                    <span
                      className={`whitespace-nowrap text-sm ${
                        active
                          ? "font-bold text-[#0B3D91]"
                          : "font-medium text-[#7B7F89]"
                      }`}
                    >
                      {step}
                    </span>
                  </div>
                  {index < steps.length - 1 && (
                    <div className="mx-4 mt-[18px] h-px flex-1 bg-[#E0E0E0]" />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="border-t border-[#E8E9EC]" />

        <form
          className="px-8 pb-8 pt-8 sm:px-10"
          onSubmit={(event) => event.preventDefault()}
        >
          <div className="mb-6">
            <h2 className="text-base font-bold text-[#1A1A2E]">
              Instrument Details
            </h2>
            <p className="mt-1 text-sm text-[#5C5C70]">
              Provide the details exactly as they appear on the manufacturer's documentation.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <FormField label="Instrument Category">
              <select
                defaultValue="cng"
                className={`${fieldClassName} w-full px-3 outline-none`}
              >
                <option value="cng">
                  Energy/Fuel - CNG Dispenser (Multi-Nozzle)
                </option>
                <option value="fuel">Energy/Fuel - Fuel Dispenser</option>
                <option value="weighbridge">Electronic Weighbridge</option>
                <option value="platform">Digital Platform Scale</option>
              </select>
            </FormField>

            <FormField label="Manufacturer Name">
              <Input
                defaultValue="Gilbarco Veeder-Root"
                className={fieldClassName}
              />
            </FormField>

            <FormField label="Model Number">
              <Input
                defaultValue="CNG-Advantage-2025"
                className={fieldClassName}
              />
            </FormField>

            <FormField label="Instrument Serial Number">
              <Input
                defaultValue="SN-8849201-MH"
                className={fieldClassName}
              />
            </FormField>

            <FormField label="Accuracy Class">
              <select
                defaultValue="class-ii"
                className={`${fieldClassName} w-full px-3 outline-none`}
              >
                <option value="class-i">Class I</option>
                <option value="class-ii">Class II</option>
                <option value="class-iii">Class III</option>
                <option value="class-iiii">Class IIII</option>
              </select>
            </FormField>

            <FormField label="Maximum Capacity / Flow Rate">
              <Input defaultValue="50 kg/min" className={fieldClassName} />
            </FormField>
          </div>

          <div className="mt-10 flex flex-col-reverse items-stretch justify-end gap-3 border-t border-[#E8E9EC] pt-6 sm:flex-row sm:items-center">
            <Button
              type="button"
              variant="ghost"
              className="font-semibold text-primary hover:bg-primary/5 hover:text-primary"
            >
              Save as Draft
            </Button>
            <Button
              type="submit"
              className="h-11 rounded-lg bg-[#FF6F00] px-5 font-bold text-white shadow-none hover:bg-[#E66000]"
            >
              Next: Location &amp; Documents
            </Button>
          </div>
        </form>
      </section>
    </DashboardLayout>
  );
}
