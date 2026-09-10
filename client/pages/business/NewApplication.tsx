import { DashboardLayout } from "@/components/emaap/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";

const steps = ["Instrument Details", "Location & Documents"];

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

const categories = {
  "Mass and Weighing": [
    "Cast Iron, Brass, Bullion & Carat Standard Weights",
    "Equal/Unequal Arm Balances & Beam Scales",
    "Commercial & Retail Scales (Class I to Class IIII)",
    "Industrial Weighbridges & Automatic Rail Weighbridges",
    "Load Cells & Automatic Check Weighers",
  ],
  "Length and Area": [
    "Rigid & Flexible Rules, Measuring Tapes",
    "Calipers, Micrometers & Dial Gauges",
    "Planimeters & Surface Area Measuring Machines",
  ],
  "Volume Flow and Capacity": [
    "Static Capacity Measures & Calibrated Tanks (Road/Rail)",
    "Laboratory Volume Measures (Flasks, Burettes, Syringes, Pipettes)",
    "Flowmeters & Piston Metering Pumps",
  ],
  "Energy Gas and Fuel": [
    "Petrol, Diesel, CNG, LNG & Hydrogen Fuel Dispensers",
    "Single/Multi-Phase Electricity Meters & Smart Meters",
    "Water Meters, Heat Meters & Gas Flowmeters",
  ],
  "Medical and Healthcare": [
    "Clinical Thermometers & Sphygmomanometers (Blood Pressure Monitors)",
    "Baby & Bed Weighing Scales",
    "Radiation Protection Dosemeters",
    "Clinical Laboratory Analyzers (Glucose, Spectrophotometers, Coagulometers)",
  ],
  "Traffic and Transport": [
    "Speedometers, Chronotachographs & Traffic Control Radars",
    "Axle Load Weighers & Breath Testers",
    "Taximeters & Automobile Tire Pressure Gauges",
  ],
  "Environmental and Safety": [
    "Sound Level Meters & Smoke Density Meters",
    "Vehicle Exhaust Analyzers (CO/SO2) & Gas Detectors",
    "Boiler Pressure Gauges & Electrical Safety Relays",
  ],
  "Official and Public Utility": [
    "Postal Scales & Customs/Toll Legislation Meters",
    "Ship/Barge Gauging Equipment & Geodetic Instruments",
    "Gaming & Slot Machines",
  ],
};

const statesAndUnionTerritories = [
  { value: "AP", label: "Andhra Pradesh (AP)" },
  { value: "AR", label: "Arunachal Pradesh (AR)" },
  { value: "AS", label: "Assam (AS)" },
  { value: "BR", label: "Bihar (BR)" },
  { value: "CG", label: "Chhattisgarh (CG)" },
  { value: "GA", label: "Goa (GA)" },
  { value: "GJ", label: "Gujarat (GJ)" },
  { value: "HR", label: "Haryana (HR)" },
  { value: "HP", label: "Himachal Pradesh (HP)" },
  { value: "JH", label: "Jharkhand (JH)" },
  { value: "KA", label: "Karnataka (KA)" },
  { value: "KL", label: "Kerala (KL)" },
  { value: "MP", label: "Madhya Pradesh (MP)" },
  { value: "MH", label: "Maharashtra (MH)" },
  { value: "MN", label: "Manipur (MN)" },
  { value: "ML", label: "Meghalaya (ML)" },
  { value: "MZ", label: "Mizoram (MZ)" },
  { value: "NL", label: "Nagaland (NL)" },
  { value: "OD", label: "Odisha (OD)" },
  { value: "PB", label: "Punjab (PB)" },
  { value: "RJ", label: "Rajasthan (RJ)" },
  { value: "SK", label: "Sikkim (SK)" },
  { value: "TN", label: "Tamil Nadu (TN)" },
  { value: "TS", label: "Telangana (TS)" },
  { value: "TR", label: "Tripura (TR)" },
  { value: "UK", label: "Uttarakhand (UK)" },
  { value: "UP", label: "Uttar Pradesh (UP)" },
  { value: "WB", label: "West Bengal (WB)" },
  { value: "AN", label: "Andaman and Nicobar Islands (AN)" },
  { value: "CH", label: "Chandigarh (CH)" },
  { value: "DN", label: "Dadra and Nagar Haveli and Daman and Diu (DN)" },
  { value: "DL", label: "Delhi (DL)" },
  { value: "JK", label: "Jammu and Kashmir (JK)" },
  { value: "LA", label: "Ladakh (LA)" },
  { value: "LD", label: "Lakshadweep (LD)" },
  { value: "PY", label: "Puducherry (PY)" },
];

export default function NewApplication() {
  const [currentStep, setCurrentStep] = useState(0);

  return (
    <DashboardLayout role="business">
      <section className="mx-auto max-w-280 rounded-xl border border-[#E0E0E0] bg-white shadow-card">
        <div className="px-8 pb-7 pt-8 sm:px-10">
          <h1 className="text-2xl font-bold tracking-tight text-[#1A1A2E]">
            New Verification Application
          </h1>

          <div className="mt-8 flex items-start">
            {steps.map((step, index) => {
              const isActive = index <= currentStep;
              const isCurrent = index === currentStep;
              return (
                <div
                  key={step}
                  className="flex min-w-0 flex-1 items-start last:flex-none"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                        isActive
                          ? "bg-[#0B3D91] text-white"
                          : "bg-[#EEF0F3] text-[#7B7F89]"
                      }`}
                    >
                      {index + 1}
                    </div>
                    <span
                      className={`whitespace-nowrap text-sm ${
                        isCurrent
                          ? "font-bold text-[#0B3D91]"
                          : isActive
                            ? "font-bold text-[#1A1A2E]"
                            : "font-medium text-[#7B7F89]"
                      }`}
                    >
                      {step}
                    </span>
                  </div>
                  {index < steps.length - 1 && (
                    <div
                      className={`mx-4 mt-4.5 h-px flex-1 ${
                        isActive && !isCurrent ? "bg-[#0B3D91]" : "bg-[#E0E0E0]"
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="border-t border-[#E8E9EC]" />

        {currentStep === 0 && (
          <InstrumentForm onNext={() => setCurrentStep(1)} />
        )}
        {currentStep === 1 && (
          <LocationDocumentsForm onBack={() => setCurrentStep(0)} />
        )}
      </section>
    </DashboardLayout>
  );
}

const InstrumentForm = ({ onNext }: { onNext: () => void }) => {
  const [selectedCategory, setSelectedCategory] = useState("");

  return (
    <form
      className="px-8 pb-8 pt-8 sm:px-10"
      onSubmit={(event) => {
        event.preventDefault();
        onNext();
      }}
    >
      <div className="mb-6">
        <h2 className="text-base font-bold text-[#1A1A2E]">
          Instrument Details
        </h2>
        <p className="mt-1 text-sm text-[#5C5C70]">
          Provide the details exactly as they appear on the manufacturer's
          documentation.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <FormField label="Instrument Category">
          <select
            onChange={(e) => setSelectedCategory(e.target.value)}
            defaultValue="Energy Gas and Fuel"
            className={`${fieldClassName} w-full px-3 outline-none`}
          >
            <option value="" disabled>
              Select a category
            </option>
            {Object.entries(categories).map(([key]) => (
              <option key={key} value={key}>
                {key}
              </option>
            ))}
          </select>
          {selectedCategory && (
            <select
              className={`${fieldClassName} w-full px-3 outline-none mt-2`}
              defaultValue="Petrol, Diesel, CNG, LNG & Hydrogen Fuel Dispensers"
            >
              <option value="" disabled>
                Select a subcategory
              </option>
              {categories[selectedCategory as keyof typeof categories].map(
                (subcategory) => (
                  <option key={subcategory} value={subcategory}>
                    {subcategory}
                  </option>
                ),
              )}
            </select>
          )}
        </FormField>

        <FormField label="Manufacturer Name">
          <Input
            defaultValue="Gilbarco Veeder-Root"
            className={fieldClassName}
          />
        </FormField>

        <FormField label="Model Number">
          <Input defaultValue="CNG-Advantage-2025" className={fieldClassName} />
        </FormField>

        <FormField label="Instrument Serial Number">
          <Input defaultValue="SN-8849201-MH" className={fieldClassName} />
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
        {/* <Button
          type="button"
          variant="ghost"
          className="font-semibold text-primary hover:bg-primary/5 hover:text-primary"
        >
          Save as Draft
        </Button> */}
        <Button
          type="submit"
          className="h-11 rounded-lg bg-[#FF6F00] px-5 font-bold text-white shadow-none hover:bg-[#E66000]"
        >
          Next: Location &amp; Documents
        </Button>
      </div>
    </form>
  );
};

const LocationDocumentsForm = ({ onBack }: { onBack: () => void }) => {
  const [coordinates, setCoordinates] = useState("");

  const getLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;

        console.log(position.coords.accuracy);

        setCoordinates(`${latitude}, ${longitude}`);
      },
      (error) => {
        console.error(error);
        alert("Unable to get your location.");
      },
    );
  };

  return (
    <form
      className="px-8 pb-8 pt-8 sm:px-10"
      onSubmit={(event) => {
        event.preventDefault();
        alert("Application Submitted Successfully for Prototype!");
      }}
    >
      <div className="mb-6">
        <h2 className="text-base font-bold text-[#1A1A2E]">
          Location & Documents
        </h2>
        <p className="mt-1 text-sm text-[#5C5C70]">
          Provide the physical installation address and upload all required
          compliance documents.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <FormField label="Installation Address (Line 1)">
          <Input
            defaultValue="Jio-BP Station, BKC"
            className={fieldClassName}
          />
        </FormField>

        <FormField label="State / UT">
          <select
            defaultValue="MH"
            className={`${fieldClassName} w-full px-3 outline-none`}
          >
            {statesAndUnionTerritories.map((state) => (
              <option key={state.value} value={state.value}>
                {state.label}
              </option>
            ))}
          </select>
        </FormField>

        <FormField label="Pincode">
          <Input defaultValue="400051" className={fieldClassName} />
        </FormField>

        <FormField label="Geo-Coordinates (Lat, Long)">
          <div className="flex gap-2">
            <Input
              value={coordinates}
              onChange={(e) => setCoordinates(e.target.value)}
              placeholder="Latitude, Longitude"
              className={fieldClassName}
            />

            <Button
              type="button"
              onClick={getLocation}
              className="h-11 whitespace-nowrap"
            >
              Use My Location
            </Button>
          </div>
        </FormField>

        <FormField label="Manufacturer Invoice / Import Doc">
          <Input type="file" className={`${fieldClassName} py-2`} />
        </FormField>

        <FormField label="Previous Certificate (If Renewal)">
          <Input type="file" className={`${fieldClassName} py-2`} />
        </FormField>
      </div>

      <div className="mt-10 flex flex-col-reverse items-stretch justify-end gap-3 border-t border-[#E8E9EC] pt-6 sm:flex-row sm:items-center">
        <Button
          type="button"
          onClick={onBack}
          variant="ghost"
          className="font-semibold text-primary hover:bg-primary/5 hover:text-primary"
        >
          Back
        </Button>
        <Button
          type="submit"
          className="h-11 rounded-lg bg-[#0B3D91] px-5 font-bold text-white shadow-none hover:bg-[#082b66]"
        >
          Submit Application
        </Button>
      </div>
    </form>
  );
};
