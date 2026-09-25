import { FormEvent, type ReactNode, useEffect, useState } from "react";
import { Loader2, CheckCircle2 } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { DashboardLayout } from "@/components/emaap/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import {
  AppType,
  PaymentMethod,
  getPaymentReceipt,
} from "@/services/business/payment.service";
import { useVerificationMetadata } from "@/hooks/useVerificationMetaData";
import {
  VerificationFeeQuote,
  CreateVerificationApplicationResponse,
  VerificationCategory,
  VerificationDistrict,
  getVerificationCategories,
  getVerificationDistricts,
  getVerificationConditions,
  getVerificationFeeQuote,
  createVerificationApplication,
  uploadVerificationDocuments,
  generatePaymentReceiptAPI,
} from "@/services/business/verificationApp.service";
import { getCurrentUser } from "@/lib/current-user";

type FormFieldProps = {
  label: string;
  children: ReactNode;
};

const steps = [
  "Instrument Details",
  "Location & Documents",
  "Review & Payment",
];

const fieldClassName =
  "h-11 rounded-lg border-[#E0E0E0] bg-white text-sm text-[#1A1A2E] shadow-none transition-colors placeholder:text-[#8A8A98] hover:border-primary focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/15";

const getAccuracyLabel = (value: string) => {
  switch (value) {
    case "CLASS_I":
      return "Class I";

    case "CLASS_II":
      return "Class II";

    case "CLASS_III":
      return "Class III";

    case "CLASS_IIII":
      return "Class IIII";

    default:
      return value;
  }
};

const formatCurrency = (amount: number) =>
  amount.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

function FormField({ label, children }: FormFieldProps) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-sm font-bold text-[#5C5C70]">{label}</span>

      {children}
    </label>
  );
}

export default function NewApplication() {
  const navigate = useNavigate();
  const location = useLocation();
  const currentUser = getCurrentUser();
  const {
    data: metadata,
    isLoading: metadataLoading,
    error: metadataError,
  } = useVerificationMetadata();

  const [currentStep, setCurrentStep] = useState(0);
  const [appType, setAppType] = useState<AppType>("INITIAL");
  const [selectedCategoryCode, setSelectedCategoryCode] = useState("");
  const [availableCategories, setAvailableCategories] = useState<
    VerificationCategory[]
  >([]);
  const [categoryLoading, setCategoryLoading] = useState(false);
  const [categoryError, setCategoryError] = useState<string | null>(null);
  const [availableConditions, setAvailableConditions] = useState<string[]>([]);
  const [selectedCondition, setSelectedCondition] = useState("");
  const [conditionLoading, setConditionLoading] = useState(false);
  const [modelNo, setModelNo] = useState("");
  const [manufacturerName, setManufacturerName] = useState("");
  const [instrumentSerialNumber, setInstrumentSerialNumber] = useState("");
  const [metric, setMetric] = useState("");
  const [errorValue, setErrorValue] = useState<number | null>(null);
  const [address, setAddress] = useState("");
  const [district, setDistrict] = useState("");
  const [availableDistricts, setAvailableDistricts] = useState<
    VerificationDistrict[]
  >([]);
  const [districtLoading, setDistrictLoading] = useState(false);
  const [pincode, setPincode] = useState<number | null>(null);
  const [stateCode, setStateCode] = useState("");

  useEffect(() => {
    if (!stateCode) {
      setAvailableDistricts([]);
      setDistrict("");
      return;
    }

    let mounted = true;

    const loadDistricts = async () => {
      try {
        setDistrictLoading(true);
        const districts = await getVerificationDistricts(stateCode);

        if (mounted) {
          setAvailableDistricts(districts);
        }
      } catch (error) {
        if (mounted) {
          setAvailableDistricts([]);
          console.error(
            "Failed to load districts for state:",
            stateCode,
            error,
          );
        }
      } finally {
        if (mounted) {
          setDistrictLoading(false);
        }
      }
    };

    void loadDistricts();

    return () => {
      mounted = false;
    };
  }, [stateCode]);
  const [coordinates, setCoordinates] = useState("");
  const [manufacturerInvoice, setManufacturerInvoice] = useState<File | null>(
    null,
  );
  const [previousCertificate, setPreviousCertificate] = useState<File | null>(
    null,
  );
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("UPI");
  const [feeQuote, setFeeQuote] = useState<VerificationFeeQuote | null>(null);
  const [isQuoting, setIsQuoting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadWarning, setUploadWarning] = useState<string | null>(null);

  useEffect(() => {
    if (location.state?.receiptId && currentUser?.userId && metadata) {
      const fetchReceipt = async () => {
        try {
          const receipt = await getPaymentReceipt(
            currentUser.userId,
            location.state.receiptId,
          );
          setAppType(receipt.application.app_type);
          setSelectedCategoryCode(
            receipt.application.instrument.category.category_code,
          );
          setModelNo(receipt.application.instrument.model_no);
          setManufacturerName(receipt.application.instrument.manufacturer_name);
          setInstrumentSerialNumber(
            receipt.application.instrument.serial_number,
          );
          setMetric(receipt.application.instrument.metric);
          setAddress(receipt.application.instrument.address);
          setPincode(receipt.application.instrument.pincode);
          setCoordinates(`${receipt.application.instrument.lat}, ${receipt.application.instrument.long}`);
          if (receipt.application.instrument.district?.district_name) {
            setDistrict(receipt.application.instrument.district.district_name);
          }

          const stateNameOrCode = receipt.application.instrument.state;
          const matchedState = metadata.states.find(
            s => s.state_name.toLowerCase() === stateNameOrCode.toLowerCase() || 
                 s.state_code.toLowerCase() === stateNameOrCode.toLowerCase()
          );
          setStateCode(matchedState ? matchedState.state_code : stateNameOrCode);

          setFeeQuote({
            statutoryFee: receipt.statutory_fee,
            additionalFee: receipt.adjusting_charges + receipt.carriage_charges,
            totalAmount: receipt.total_amount,
            feeBasis: "From Previous Receipt",
            condition: null,
            maximumFee: null,
          });

          setCurrentStep(1);
        } catch (e) {
          console.error("Failed to load receipt", e);
        }
      };
      fetchReceipt();
    }
  }, [location.state?.receiptId, currentUser?.userId, metadata]);

  const selectedCategory = availableCategories.find(
    (category) => category.category_code === selectedCategoryCode,
  );

  useEffect(() => {
    if (!stateCode) {
      setAvailableCategories([]);
      setCategoryError(null);
      return;
    }

    let mounted = true;

    const loadCategories = async () => {
      try {
        setCategoryLoading(true);
        setCategoryError(null);
        const categories = await getVerificationCategories(stateCode);

        if (mounted) {
          setAvailableCategories(categories);
        }
      } catch (error) {
        if (mounted) {
          setAvailableCategories([]);
          setCategoryError(
            error instanceof Error
              ? error.message
              : "Failed to load categories",
          );
        }
      } finally {
        if (mounted) {
          setCategoryLoading(false);
        }
      }
    };

    void loadCategories();

    return () => {
      mounted = false;
    };
  }, [stateCode]);

  useEffect(() => {
    setAvailableConditions([]);
    setSelectedCondition("");

    if (!stateCode || !selectedCategoryCode) {
      return;
    }

    let mounted = true;

    const loadConditions = async () => {
      try {
        setConditionLoading(true);
        const conditions = await getVerificationConditions(
          stateCode,
          selectedCategoryCode,
        );

        if (mounted) {
          setAvailableConditions(conditions);
        }
      } catch (error) {
        if (mounted) {
          setAvailableConditions([]);
          alert(
            error instanceof Error
              ? error.message
              : "Failed to load instrument conditions",
          );
        }
      } finally {
        if (mounted) {
          setConditionLoading(false);
        }
      }
    };

    void loadConditions();

    return () => {
      mounted = false;
    };
  }, [selectedCategoryCode, stateCode]);

  const getLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");

      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;

        setCoordinates(`${latitude}, ${longitude}`);
      },
      (error) => {
        console.error(error);

        alert("Unable to get your location.");
      },
    );
  };

  const parseCoordinates = (): {
    latitude: number;
    longitude: number;
  } | null => {
    const [latitude, longitude] = coordinates
      .split(",")
      .map((value) => Number(value.trim()));

    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      return null;
    }

    return {
      latitude,
      longitude,
    };
  };

  const handleInstrumentStep = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!appType) {
      alert("Please select the application type.");
      return;
    }

    if (!selectedCategory) {
      alert("Please select an instrument category.");
      return;
    }

    if (availableConditions.length > 0 && !selectedCondition) {
      alert("Please select the instrument condition.");
      return;
    }

    if (!manufacturerName.trim()) {
      alert("Please enter the manufacturer name.");
      return;
    }

    if (!modelNo.trim()) {
      alert("Please enter the model number.");
      return;
    }

    if (!instrumentSerialNumber.trim()) {
      alert("Please enter the instrument serial number.");
      return;
    }

    if (!metric.trim()) {
      alert("Please enter the maximum capacity / flow rate.");
      return;
    }

    if (
      errorValue !== null &&
      (!Number.isFinite(errorValue) || errorValue < 0)
    ) {
      alert("Please enter a valid non-negative measurement error.");
      return;
    }

    setCurrentStep(1);
  };

  const handleLocationStep = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!address.trim()) {
      alert("Please enter the installation address.");
      return;
    }

    if (pincode === null || !Number.isInteger(pincode)) {
      alert("Please enter a valid 6-digit pincode.");
      return;
    }

    if (!stateCode) {
      alert("Please select a state.");
      return;
    }

    const location = parseCoordinates();

    if (!location) {
      alert("Please enter valid latitude and longitude coordinates.");
      return;
    }

    if (!selectedCategory) {
      alert("Please select an instrument category.");
      return;
    }

    if (!currentUser?.userId) {
      alert("User not found. Please log in again.");
      return;
    }

    try {
      setIsQuoting(true);

      const quote = await getVerificationFeeQuote({
        userId: currentUser.userId,
        categoryCode: selectedCategory.category_code,
        stateCode,
        metric,
        error: errorValue ?? undefined,
        selectedCondition: selectedCondition || undefined,
      });

      setFeeQuote(quote);

      setCurrentStep(2);
    } catch (error) {
      console.error("Fee quote failed:", error);

      alert(
        error instanceof Error
          ? error.message
          : "Unable to calculate verification fee.",
      );
    } finally {
      setIsQuoting(false);
    }
  };

  const submitApplication = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    if (!currentUser?.userId) {
      alert("User not found. Please log in again.");
      return;
    }

    if (!selectedCategory) {
      alert("Please select an instrument category.");
      return;
    }

    if (!feeQuote) {
      alert(
        "Fee quote is missing. Please go back and calculate the fee again.",
      );
      return;
    }

    const parsedLocation = parseCoordinates();

    if (!parsedLocation) {
      alert("Invalid location coordinates.");
      return;
    }

    if (pincode === null) {
      alert("Please enter a pincode.");
      return;
    }

    if (!district.trim()) {
      alert("Please enter a district.");
      return;
    }

    if (!manufacturerInvoice) {
      alert("Please upload the manufacturer invoice / import document.");
      return;
    }

    if (appType === "RE_VERIFICATION" && !previousCertificate) {
      alert("Please upload the previous certificate for re-verification.");
      return;
    }

    setIsSubmitting(true);
    setUploadWarning(null);

    try {
      if (location.state?.receiptId && feeQuote) {
        // Skip application creation and just mark payment as success
        const receipt = await getPaymentReceipt(
          currentUser.userId,
          location.state.receiptId,
        );
        await generatePaymentReceiptAPI(
          receipt.application.app_id,
          paymentMethod,
          feeQuote.statutoryFee,
          feeQuote.totalAmount,
        );

        navigate("/business/application-submitted", {
          state: {
            applicationId: receipt.application.application_no,
            applicationType: receipt.application.app_type,
            categoryName: receipt.application.instrument.category.category_name,
            receiptNo: receipt.receipt_no,
            totalAmount: feeQuote.totalAmount,
          },
        });
        return;
      }

      const uploadResult = await uploadVerificationDocuments(
        manufacturerInvoice,
        previousCertificate,
      );

      const result = await createVerificationApplication({
        userId: currentUser.userId,
        appType,
        categoryCode: selectedCategory.category_code,
        instrumentSubCategory: selectedCategory.category_name,
        modelNo,
        manufacturerName,
        instrumentSerialNumber,
        metric,
        error: errorValue ?? undefined,
        selectedCondition: selectedCondition || undefined,
        address,
        district,
        pincode,
        stateCode,
        lat: parsedLocation.latitude,
        long: parsedLocation.longitude,
        paymentMethod,
        manufacturerFileUrl: uploadResult.manufacturerFileUrl,
        prevCertificateFileUrl: uploadResult.prevCertificateFileUrl,
        applicationId: uploadResult.applicationId,
        statuatory_fee: feeQuote?.totalAmount,
        adjusting_charges: 0,
        carriage_charges: 0,
      });

      navigate("/business/application-submitted", {
        state: {
          applicationId: result.applicationNo,
          applicationType: result.applicationType,
          categoryName: result.category.categoryName,
          receiptNo: result.payment.receiptNo,
          totalAmount: feeQuote?.totalAmount ?? result.payment.totalAmount,
        },
      });
    } catch (error) {
      console.error("Application submission failed:", error);

      alert(
        error instanceof Error
          ? error.message
          : "Failed to submit application.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetApplication = () => {
    setCurrentStep(0);
    setAppType("INITIAL");
    setSelectedCategoryCode("");
    setAvailableCategories([]);
    setAvailableConditions([]);
    setSelectedCondition("");
    setModelNo("");
    setManufacturerName("");
    setInstrumentSerialNumber("");
    setMetric("");
    setErrorValue(null);
    setAddress("");
    setDistrict("");
    setPincode(null);
    setStateCode("");
    setCoordinates("");
    setManufacturerInvoice(null);
    setPreviousCertificate(null);
    setPaymentMethod("UPI");
    setFeeQuote(null);
    setUploadWarning(null);
  };
  return (
    <DashboardLayout role="business">
      <section className="mx-auto max-w-280 rounded-xl border border-[#E0E0E0] bg-white shadow-card">
        <div className="px-4 pb-7 pt-6 sm:px-10 sm:pt-8">
          <h1 className="text-2xl font-bold tracking-tight text-[#1A1A2E]">
            New Verification Application
          </h1>

          <div className="mt-8 flex items-start">
            {steps.map((step, index) => {
              const isActive = index <= currentStep;
              const isCurrent = index === currentStep;
              const textClass = isCurrent
                ? "font-bold text-[#0B3D91]"
                : isActive
                  ? "font-bold text-[#1A1A2E]"
                  : "font-medium text-[#7B7F89]";

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

                    <span className={`hidden text-sm sm:block ${textClass}`}>
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
          <form
            className="px-4 pb-8 pt-6 sm:px-10 sm:pt-8"
            onSubmit={handleInstrumentStep}
          >
            <div className="mb-6">
              <h2 className="text-base font-bold text-[#1A1A2E]">
                Instrument Details
              </h2>

              <p className="mt-1 text-sm text-[#5C5C70]">
                Select the instrument category from the categories configured in
                the Legal Metrology system.
              </p>
            </div>

            {metadataLoading && (
              <div className="mb-6 flex items-center gap-2 rounded-lg bg-blue-50 p-4 text-sm text-blue-800">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading instrument categories...
              </div>
            )}

            {metadataError && (
              <div className="mb-6 rounded-lg bg-red-50 p-4 text-sm text-red-700">
                {metadataError}
              </div>
            )}

            {categoryError && (
              <div className="mb-6 rounded-lg bg-red-50 p-4 text-sm text-red-700">
                {categoryError}
              </div>
            )}

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <FormField label="Application Type">
                <select
                  value={appType}
                  onChange={(event) =>
                    setAppType(event.target.value as AppType)
                  }
                  className={`${fieldClassName} w-full px-3 outline-none`}
                >
                  <option value="INITIAL">Initial Verification</option>

                  <option value="RE_VERIFICATION">Re-verification</option>
                </select>
              </FormField>

              <FormField label="State / UT">
                <select
                  value={stateCode}
                  onChange={(event) => {
                    setStateCode(event.target.value);
                    setSelectedCategoryCode("");
                    setSelectedCondition("");
                    setAvailableCategories([]);
                    setCategoryError(null);
                  }}
                  className={`${fieldClassName} w-full px-3 outline-none`}
                >
                  <option value="">Select state first</option>

                  {metadata?.states.map((state) => (
                    <option key={state.state_id} value={state.state_code}>
                      {state.state_name} ({state.state_code})
                    </option>
                  ))}
                </select>
              </FormField>

              <FormField label="Instrument Category">
                <select
                  value={selectedCategoryCode}
                  disabled={!stateCode || categoryLoading || !metadata}
                  onChange={(event) => {
                    setSelectedCategoryCode(event.target.value);
                  }}
                  className={`${fieldClassName} w-full px-3 outline-none`}
                >
                  <option value="">
                    {categoryLoading
                      ? "Loading categories..."
                      : "Select a category"}
                  </option>

                  {availableCategories.map((category) => (
                    <option
                      key={category.category_id}
                      value={category.category_code}
                    >
                      {category.category_name}
                    </option>
                  ))}
                </select>
              </FormField>

              {availableConditions.length > 0 && (
                <FormField label="Instrument Condition">
                  <select
                    value={selectedCondition}
                    disabled={conditionLoading}
                    onChange={(event) =>
                      setSelectedCondition(event.target.value)
                    }
                    className={`${fieldClassName} w-full px-3 outline-none`}
                  >
                    <option value="">
                      {conditionLoading
                        ? "Loading conditions..."
                        : "Select an instrument condition"}
                    </option>

                    {availableConditions.map((condition) => (
                      <option key={condition} value={condition}>
                        {condition}
                      </option>
                    ))}
                  </select>
                </FormField>
              )}

              <FormField label="Manufacturer Name">
                <Input
                  value={manufacturerName}
                  placeholder="e.g. Gilbarco Veeder-Root"
                  className={fieldClassName}
                  onChange={(event) => setManufacturerName(event.target.value)}
                />
              </FormField>

              <FormField label="Model Number">
                <Input
                  value={modelNo}
                  placeholder="e.g. CNG-Advantage-2025"
                  className={fieldClassName}
                  onChange={(event) => setModelNo(event.target.value)}
                />
              </FormField>

              <FormField label="Instrument Serial Number">
                <Input
                  value={instrumentSerialNumber}
                  placeholder="e.g. SN-8849201-MH"
                  className={fieldClassName}
                  onChange={(event) =>
                    setInstrumentSerialNumber(event.target.value)
                  }
                />
              </FormField>

              <FormField label="Accuracy Class">
                <Input
                  value={
                    selectedCategoryCode
                      ? getAccuracyLabel(selectedCategory.accuracy_class)
                      : ""
                  }
                  readOnly
                  placeholder="Selected category determines accuracy class"
                  className={fieldClassName}
                />
              </FormField>

              <FormField label="Maximum Capacity / Flow Rate">
                <Input
                  value={metric}
                  placeholder="e.g. 50 kg/min"
                  className={fieldClassName}
                  onChange={(event) => setMetric(event.target.value)}
                />
              </FormField>

              <FormField label="Measurement Error">
                <Input
                  type="number"
                  min="0"
                  step="any"
                  value={errorValue ?? ""}
                  placeholder="e.g. 0.05"
                  className={fieldClassName}
                  onChange={(event) => {
                    const value = event.target.value;

                    setErrorValue(value === "" ? null : Number(value));
                  }}
                />
              </FormField>
            </div>

            {selectedCategory && (
              <div className="mt-6 rounded-lg border border-blue-100 bg-blue-50 p-4">
                <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-3">
                  <div>
                    <p className="text-xs font-bold uppercase text-[#5C5C70]">
                      Category Code
                    </p>

                    <p className="mt-1 font-medium text-[#1A1A2E]">
                      {selectedCategory.category_code}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-bold uppercase text-[#5C5C70]">
                      OIML Standard
                    </p>

                    <p className="mt-1 font-medium text-[#1A1A2E]">
                      {selectedCategory.oiml_standard_ref}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-bold uppercase text-[#5C5C70]">
                      Verification Cycle
                    </p>

                    <p className="mt-1 font-medium text-[#1A1A2E]">
                      {selectedCategory.verification_cycle_months} months
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-10 flex justify-end border-t border-[#E8E9EC] pt-6">
              <Button
                type="submit"
                disabled={metadataLoading || !metadata}
                className="h-11 rounded-lg bg-[#FF6F00] px-5 font-bold text-white shadow-none hover:bg-[#E66000]"
              >
                Next: Location & Documents
              </Button>
            </div>
          </form>
        )}

        {currentStep === 1 && (
          <form
            className="px-4 pb-8 pt-6 sm:px-10 sm:pt-8"
            onSubmit={handleLocationStep}
          >
            <div className="mb-6">
              <h2 className="text-base font-bold text-[#1A1A2E]">
                Location & Documents
              </h2>

              <p className="mt-1 text-sm text-[#5C5C70]">
                Provide the physical installation location and required
                documents.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <FormField label="Installation Address">
                <Input
                  value={address}
                  placeholder="e.g. Jio-BP Station, BKC"
                  className={fieldClassName}
                  onChange={(event) => setAddress(event.target.value)}
                />
              </FormField>

              <FormField label="District">
                <select
                  value={district}
                  disabled={!stateCode || districtLoading}
                  onChange={(event) => setDistrict(event.target.value)}
                  className={`${fieldClassName} w-full px-3 outline-none`}
                >
                  <option value="">
                    {districtLoading
                      ? "Loading districts..."
                      : !stateCode
                        ? "Select a state first"
                        : "Select a district"}
                  </option>

                  {availableDistricts.map((d) => (
                    <option key={d.district_id} value={d.district_name}>
                      {d.district_name}
                    </option>
                  ))}
                </select>
              </FormField>

              <FormField label="Pincode">
                <Input
                  type="number"
                  min="100000"
                  max="999999"
                  value={pincode ?? ""}
                  placeholder="e.g. 400051"
                  className={fieldClassName}
                  onChange={(event) => {
                    const value = event.target.value;

                    setPincode(value === "" ? null : Number(value));
                  }}
                />
              </FormField>

              <FormField label="Geo-Coordinates (Lat, Long)">
                <div className="flex gap-2">
                  <Input
                    value={coordinates}
                    onChange={(event) => setCoordinates(event.target.value)}
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

              <FormField label="Manufacturer Invoice / Import Document">
                <Input
                  type="file"
                  className={`${fieldClassName} py-2`}
                  onChange={(event) =>
                    setManufacturerInvoice(event.target.files?.[0] ?? null)
                  }
                />

                {manufacturerInvoice && (
                  <p className="text-sm text-gray-600">
                    {manufacturerInvoice.name}
                  </p>
                )}
              </FormField>

              <FormField label="Previous Certificate">
                <Input
                  type="file"
                  className={`${fieldClassName} py-2`}
                  onChange={(event) =>
                    setPreviousCertificate(event.target.files?.[0] ?? null)
                  }
                />

                {previousCertificate && (
                  <p className="text-sm text-gray-600">
                    {previousCertificate.name}
                  </p>
                )}
              </FormField>
            </div>

            <div className="mt-10 flex flex-col-reverse items-stretch justify-end gap-3 border-t border-[#E8E9EC] pt-6 sm:flex-row sm:items-center">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setCurrentStep(0)}
                className="font-semibold text-primary hover:bg-primary/5 hover:text-primary"
              >
                Back
              </Button>

              <Button
                type="submit"
                disabled={isQuoting}
                className="h-11 rounded-lg bg-[#FF6F00] px-5 font-bold text-white shadow-none hover:bg-[#E66000]"
              >
                {isQuoting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Calculating Fee...
                  </>
                ) : (
                  "Next: Review & Payment"
                )}
              </Button>
            </div>
          </form>
        )}

        {currentStep === 2 && (
          <form
            className="px-4 pb-8 pt-6 sm:px-10 sm:pt-8"
            onSubmit={submitApplication}
          >
            <div className="mb-6">
              <h2 className="text-base font-bold text-[#1A1A2E]">
                Review & Payment
              </h2>

              <p className="mt-1 text-sm text-[#5C5C70]">
                Review the server-calculated statutory fee and select the
                payment method.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
              <div className="rounded-lg border border-[#E0E0E0] bg-[#F5F7FA] p-6">
                <h3 className="mb-4 font-bold text-[#1A1A2E]">
                  Application Summary
                </h3>

                <div className="mb-3 flex justify-between gap-4 text-sm">
                  <span className="text-[#5C5C70]">Application Type</span>

                  <span className="font-medium text-[#1A1A2E]">
                    {appType === "INITIAL"
                      ? "Initial Verification"
                      : "Re-verification"}
                  </span>
                </div>

                <div className="mb-3 flex justify-between gap-4 text-sm">
                  <span className="text-[#5C5C70]">Instrument Category</span>

                  <span className="max-w-[60%] text-right font-medium text-[#1A1A2E]">
                    {selectedCategory?.category_name}
                  </span>
                </div>

                <div className="mb-3 flex justify-between gap-4 text-sm">
                  <span className="text-[#5C5C70]">Accuracy Class</span>

                  <span className="font-medium text-[#1A1A2E]">
                    {selectedCategory
                      ? getAccuracyLabel(selectedCategory.accuracy_class)
                      : "N/A"}
                  </span>
                </div>

                <div className="mb-3 flex justify-between gap-4 text-sm">
                  <span className="text-[#5C5C70]">State</span>

                  <span className="font-medium text-[#1A1A2E]">
                    {
                      metadata?.states.find(
                        (item) => item.state_code === stateCode,
                      )?.state_name
                    }
                  </span>
                </div>

                <div className="my-4 border-t border-[#E0E0E0]" />

                <h3 className="mb-4 font-bold text-[#1A1A2E]">Fee Summary</h3>

                <div className="mb-3 flex justify-between text-sm">
                  <span className="text-[#5C5C70]">Statutory Fee</span>

                  <span className="font-medium text-[#1A1A2E]">
                    ₹{formatCurrency(feeQuote?.statutoryFee ?? 0)}
                  </span>
                </div>

                <div className="mb-3 flex justify-between text-sm">
                  <span className="text-[#5C5C70]">Additional Fee</span>

                  <span className="font-medium text-[#1A1A2E]">
                    ₹{formatCurrency(feeQuote?.additionalFee ?? 0)}
                  </span>
                </div>

                <div className="mb-3 flex justify-between text-sm">
                  <span className="text-[#5C5C70]">Processing Fee</span>

                  <span className="font-medium text-[#1A1A2E]">₹0.00</span>
                </div>

                <div className="my-4 border-t border-[#E0E0E0]" />

                <div className="flex justify-between text-lg font-bold">
                  <span className="text-[#1A1A2E]">Total Payable</span>

                  <span className="text-[#1E8E3E]">
                    ₹{formatCurrency(feeQuote?.totalAmount ?? 0)}
                  </span>
                </div>

                {feeQuote?.feeBasis && (
                  <p className="mt-3 text-xs text-[#5C5C70]">
                    Fee basis: {feeQuote.feeBasis}
                  </p>
                )}
              </div>

              <div>
                <h3 className="mb-4 font-bold text-[#1A1A2E]">
                  Select Payment Method
                </h3>

                <div className="flex flex-col gap-3">
                  <Label
                    className={`flex cursor-pointer items-center gap-3 rounded-lg border p-4 transition-colors ${
                      paymentMethod === "UPI"
                        ? "border-[#0B3D91] bg-blue-50"
                        : "border-[#E0E0E0] bg-white"
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="UPI"
                      checked={paymentMethod === "UPI"}
                      onChange={() => setPaymentMethod("UPI")}
                      className="h-4 w-4"
                    />

                    <span className="font-medium">UPI</span>
                  </Label>

                  <Label
                    className={`flex cursor-pointer items-center gap-3 rounded-lg border p-4 transition-colors ${
                      paymentMethod === "NET_BANKING"
                        ? "border-[#0B3D91] bg-blue-50"
                        : "border-[#E0E0E0] bg-white"
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="NET_BANKING"
                      checked={paymentMethod === "NET_BANKING"}
                      onChange={() => setPaymentMethod("NET_BANKING")}
                      className="h-4 w-4"
                    />

                    <span className="font-medium">Net Banking</span>
                  </Label>

                  <Label
                    className={`flex cursor-pointer items-center gap-3 rounded-lg border p-4 transition-colors ${
                      paymentMethod === "NEFT_RTGS"
                        ? "border-[#0B3D91] bg-blue-50"
                        : "border-[#E0E0E0] bg-white"
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="NEFT_RTGS"
                      checked={paymentMethod === "NEFT_RTGS"}
                      onChange={() => setPaymentMethod("NEFT_RTGS")}
                      className="h-4 w-4"
                    />

                    <span className="font-medium">NEFT / RTGS</span>
                  </Label>
                </div>

                <div className="mt-6 rounded-lg bg-gray-50 p-4 text-sm text-[#5C5C70]">
                  This environment currently records the selected method as a
                  successful demo payment. A real payment gateway can replace
                  this later.
                </div>
              </div>
            </div>

            <div className="mt-10 flex flex-col-reverse items-stretch justify-end gap-3 border-t border-[#E8E9EC] pt-6 sm:flex-row sm:items-center">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setCurrentStep(1)}
                className="font-semibold text-primary hover:bg-primary/5 hover:text-primary"
              >
                Back
              </Button>

              <Button
                type="submit"
                disabled={isSubmitting || !feeQuote}
                className="h-11 rounded-lg bg-[#0B3D91] px-5 font-bold text-white shadow-none hover:bg-[#082b66]"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    Pay ₹{formatCurrency(feeQuote?.totalAmount ?? 0)} & Submit
                    Application
                  </>
                )}
              </Button>
            </div>
          </form>
        )}
      </section>
    </DashboardLayout>
  );
}
