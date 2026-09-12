import { DashboardLayout } from "@/components/emaap/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormEvent, useEffect, useState } from "react";
import { io } from "socket.io-client";
import { QRCodeCanvas } from "qrcode.react";
import { SuccessPopup } from "../../components/ui/SuccessPopUp";

const backendUrl = (import.meta.env.VITE_BACKEND_URL ?? "http://localhost:8008").replace(
  /\/$/,
  "",
);

const socket = io(backendUrl, {
  autoConnect: false,
});

type Accclass = "Class I" | "Class II" | "Class III" | "Class IIII";
interface VerificationForm {
  applicationId: string;
  instrumentCategory: string;
  instrumentSubCategory: string;
  modelNo: string;
  accuracyClass: Accclass;
  manufacturerName: string;
  instrumentSerialNumber: string;
  metric: string;
  address: string;
  pincode: number;
  state: string;
  lat: number;
  long: number;
}

const steps = ["Instrument Details", "Location & Documents"];

function FormField({
  label,
  children,
}: {
  readonly label: string;
  readonly children: React.ReactNode;
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
  const [selectedCategory, setSelectedCategory] = useState("");
  const [instrumentSubCategory, setInstrumentSubCategory] = useState("");
  const [modelNo, setModelNo] = useState("");
  const [accuracyClass, setAccuracyClass] = useState<Accclass>("Class II");
  const [manufacturerName, setManufacturerName] = useState("");
  const [instrumentSerialNumber, setInstrumentSerialNumber] = useState("");
  const [metric, setMetric] = useState("");
  const [address, setAddress] = useState("");
  const [pincode, setPincode] = useState<number | null>(null);
  const [manufacturerInvoice, setManufacturerInvoice] = useState<File | null>(
    null,
  );
  const [state, setState] = useState("MH");
  const [coordinates, setCoordinates] = useState("");
  const [prevCertificate, setPrevCertificate] = useState<File | null>(null);
  const [connected, setConnected] = useState(false);
  const [socketId, setSocketId] = useState<string | undefined>();
  const [certificateData, setCertificateData] = useState<any>(null);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);

  useEffect(() => {
    const onConnect = () => {
      console.log("Socket connected:", socket.id);

      setConnected(true);
      setSocketId(socket.id);
    };

    const onDisconnect = () => {
      console.log("Socket disconnected");

      setConnected(false);
      setSocketId(undefined);
    };

    const onConnectError = (error: Error) => {
      console.error("Socket connection error:", error.message);
    };

    const onReply = (data: unknown) => {
      console.log(JSON.stringify(data));
    };

    socket.on("reply", onReply);
    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("connect_error", onConnectError);
    socket.on("certificate_generated", (data) => {
      console.log("BOOM! Certificate received from LMO:", data);
      setCertificateData(data);
    });

    socket.connect();

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("connect_error", onConnectError);
      socket.off("reply", onReply);
      socket.off("certificate_generated");

      socket.disconnect();
    };
  }, []);

  const renderInstrumentForm = () => {
    return (
      <form
        className="px-8 pb-8 pt-8 sm:px-10"
        onSubmit={(event) => {
          event.preventDefault();
          setCurrentStep(1);
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
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setInstrumentSubCategory("");
              }}
              className={`${fieldClassName} w-full px-3 outline-none`}
            >
              <option value="">Select a category</option>

              {Object.entries(categories).map(([key]) => (
                <option key={key} value={key}>
                  {key}
                </option>
              ))}
            </select>

            {selectedCategory && (
              <select
                value={instrumentSubCategory}
                onChange={(e) => setInstrumentSubCategory(e.target.value)}
                className={`${fieldClassName} w-full px-3 outline-none mt-2`}
              >
                <option value="">Select a subcategory</option>

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
              value={manufacturerName}
              placeholder="e.g. Gilbarco Veeder-Root"
              className={fieldClassName}
              onChange={(e) => setManufacturerName(e.target.value)}
            />
          </FormField>

          <FormField label="Model Number">
            <Input
              value={modelNo}
              placeholder="e.g. CNG-Advantage-2025"
              className={fieldClassName}
              onChange={(e) => setModelNo(e.target.value)}
            />
          </FormField>

          <FormField label="Instrument Serial Number">
            <Input
              value={instrumentSerialNumber}
              placeholder="e.g. SN-8849201-MH"
              className={fieldClassName}
              onChange={(e) => setInstrumentSerialNumber(e.target.value)}
            />
          </FormField>

          <FormField label="Accuracy Class">
            <select
              value={accuracyClass}
              className={`${fieldClassName} w-full px-3 outline-none`}
              onChange={(e) => setAccuracyClass(e.target.value as Accclass)}
            >
              <option value="Class I">Class I</option>
              <option value="Class II">Class II</option>
              <option value="Class III">Class III</option>
              <option value="Class IIII">Class IIII</option>
            </select>
          </FormField>

          <FormField label="Maximum Capacity / Flow Rate">
            <Input
              value={metric}
              placeholder="e.g. 50 kg/min"
              className={fieldClassName}
              onChange={(e) => setMetric(e.target.value)}
            />
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

  const renderLocationDocumentsForm = () => {
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
        onSubmit={(e) => submitApplication(e)}
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
              value={address}
              placeholder="e.g. Jio-BP Station, BKC"
              className={fieldClassName}
              onChange={(e) => setAddress(e.target.value)}
            />
          </FormField>

          <FormField label="State / UT">
            <select
              value={state}
              className={`${fieldClassName} w-full px-3 outline-none`}
              onChange={(e) => setState(e.target.value)}
            >
              {statesAndUnionTerritories.map((state) => (
                <option key={state.value} value={state.value}>
                  {state.label}
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="Pincode">
            <Input
              type="number"
              value={pincode}
              placeholder="e.g. 400051"
              className={fieldClassName}
              onChange={(e) =>
                setPincode(e.target.value === "" ? null : Number(e.target.value))
              }
            />
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
            <Input
              type="file"
              className={`${fieldClassName} py-2`}
              onChange={(e) => {
                const file = e.target.files?.[0] ?? null;
                setManufacturerInvoice(file);
                console.log("Previous Certificate:", prevCertificate);
                console.log("Manufacturer Certificate", manufacturerInvoice);
              }}
            />
            {manufacturerInvoice && (
              <p className="mt-2 text-sm text-gray-600">
                Selected file: {manufacturerInvoice.name}
              </p>
            )}
          </FormField>

          <FormField label="Previous Certificate (If Renewal)">
            <Input
              type="file"
              className={`${fieldClassName} py-2`}
              onChange={(e) => {
                const file = e.target.files?.[0] ?? null;
                setPrevCertificate(file);
                console.log("Previous Certificate:", prevCertificate);
                console.log("Manufacturer Certificate", manufacturerInvoice);
              }}
            />
            {prevCertificate && (
              <p className="mt-2 text-sm text-gray-600">
                Selected file: {prevCertificate.name}
              </p>
            )}
          </FormField>
        </div>

        <div className="mt-10 flex flex-col-reverse items-stretch justify-end gap-3 border-t border-[#E8E9EC] pt-6 sm:flex-row sm:items-center">
          <Button
            type="button"
            onClick={() => setCurrentStep(0)}
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

  const submitApplication = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const applicationId = crypto.randomUUID();

    const [latitude, longitude] = coordinates
      .split(",")
      .map((value) => Number(value.trim()));

    if (!accuracyClass) {
      alert("Please select an accuracy class");
      return;
    }

    if (pincode === null) {
      alert("Please enter a pincode");
      return;
    }

    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      alert("Please enter valid latitude and longitude coordinates");
      return;
    }

    const payload: VerificationForm = {
      applicationId,
      instrumentCategory: selectedCategory,
      instrumentSubCategory,
      modelNo,
      accuracyClass,
      manufacturerName,
      instrumentSerialNumber,
      metric,
      address,
      pincode,
      state,
      lat: latitude,
      long: longitude,
    };

    console.log(`Sent Data`, payload);

    socket.emit("data", payload);

    if (!manufacturerInvoice) {
      alert("No Manufacturer Invoice Uploaded");
      return;
    }

    const formData = new FormData();
    formData.append("manufacturerFile", manufacturerInvoice);
    formData.append("applicationId", applicationId);
    if (prevCertificate) {
      formData.append("prevCertificateFile", prevCertificate);
    }
    try {
      await fetch(`${backendUrl}/api/upload`, {
        method: "POST",
        body: formData,
      });
      console.log("File uploaded successfully");
    } catch (error) {
      console.error("File upload failed", error);
    }
    setShowSuccessPopup(true);
  };

  if (certificateData) {
    const verificationUrl = `${backendUrl}/verify/${certificateData.certificateId}`;

    return (
      <DashboardLayout role="business">
        <section className="mx-auto max-w-200 rounded-xl border border-[#1E8E3E] bg-white p-10 text-center shadow-lg">
          <div className="mb-6 flex justify-center">
            <div className="rounded-full bg-[#E8F5E9] p-4">
              <svg
                className="h-12 w-12 text-[#1E8E3E]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
          </div>

          <h1 className="mb-2 text-3xl font-bold text-[#1A1A2E]">
            Verification Complete
          </h1>
          <p className="mb-8 text-[#5C5C70]">
            Digital Certificate generated securely via Legal Metrology
            Authority.
          </p>

          <div className="mb-8 grid grid-cols-2 gap-8 rounded-lg border border-[#E0E0E0] bg-[#F5F7FA] p-6 text-left">
            <div>
              <p className="mb-1 text-xs font-bold uppercase text-[#5C5C70]">
                Certificate ID
              </p>
              <p className="font-semibold text-[#1A1A2E]">
                {certificateData.certificateId}
              </p>
            </div>
            <div>
              <p className="mb-1 text-xs font-bold uppercase text-[#5C5C70]">
                Instrument
              </p>
              <p className="font-semibold text-[#1A1A2E]">
                {certificateData.instrumentCategory || "N/A"}
              </p>
            </div>
            <div>
              <p className="mb-1 text-xs font-bold uppercase text-[#5C5C70]">
                Serial Number
              </p>
              <p className="font-semibold text-[#1A1A2E]">
                {certificateData.instrumentSerialNumber || "N/A"}
              </p>
            </div>
            <div>
              <p className="mb-1 text-xs font-bold uppercase text-[#5C5C70]">
                Cryptographic Hash (SHA-256)
              </p>
              <p className="truncate rounded bg-blue-50 p-1 font-mono text-xs text-[#0B3D91]">
                {certificateData.hash}
              </p>
            </div>
          </div>

          <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-[#E0E0E0] bg-white p-6">
            <h3 className="mb-4 font-bold text-[#0B3D91]">
              Scan to Verify Physical Seal
            </h3>
            <QRCodeCanvas
              value={verificationUrl}
              size={200}
              fgColor="#1A1A2E"
              level="H"
              marginSize={4}
            />
            <p className="mt-4 max-w-sm text-sm text-[#5C5C70]">
              Judges: Please scan this QR code with your smartphone camera to
              view the live geo-tagged seal evidence.
            </p>
          </div>

          <Button
            className="mt-8 bg-[#0B3D91] hover:bg-[#082b66]"
            onClick={() => setCertificateData(null)}
          >
            Submit Another Application
          </Button>
        </section>
      </DashboardLayout>
    );
  }

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
              let stepTextClass = "font-medium text-[#7B7F89]";
              if (isActive) {
                stepTextClass = "font-bold text-[#1A1A2E]";
              }
              if (isCurrent) {
                stepTextClass = "font-bold text-[#0B3D91]";
              }
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
                      className={`whitespace-nowrap text-sm ${stepTextClass}`}
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

        {currentStep === 0 && renderInstrumentForm()}
        {currentStep === 1 && renderLocationDocumentsForm()}
      </section>
      <SuccessPopup
        show={showSuccessPopup}
        onClose={() => setShowSuccessPopup(false)}
      />
    </DashboardLayout>
  );
}
