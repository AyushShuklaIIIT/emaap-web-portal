import { useMemo, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Check, ShieldCheck, UserRound, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useGatewayApi } from "@/contexts/GatewayApiContext";
import {
  RoleFormRenderer,
  type RoleFormValues,
  type SupportedRegistrationRole,
} from "@/components/registration/RoleFormRenderer";
import { DualOtpModal } from "@/components/registration/DualOtpModal";
import type { GstinBusinessData } from "@/components/registration/GstinVerificationInput";

type Role = "STAKEHOLDER" | "ADMIN" | "LMO_GATC";
type StaffRole = "LMO" | "GATC_PRINCIPAL";

interface RegistrationFormData extends RoleFormValues {
  fullName: string;
  mobile: string;
  email: string;
  password: string;
  businessName: string;
  category: string;
  pan: string;
  gstin: string;
  legalBusinessName: string;
  tradeName: string;
  stateCode: string;
  registeredAddress: string;
  employeeId: string;
  tradeLicenseNo: string;
  businessAddress: string;
  departmentName: string;
  designation: string;
  jurisdictionDistrict: string;
  jurisdictionState: string;
  otpSessionId: string;
  mobileOtp: string;
  emailOtp: string;
  lat: number | null;
  long: number | null;
}

interface RegistrationResponse {
  userId: string;
  applicationId: string;
  status: "OTP_PENDING";
  otpSessionId: string;
}

const steps = [
  "Role Selection",
  "Demographic & Business",
  "Identity Verification",
  "Dual OTP & Complete",
] as const;

const roles: Array<{ value: Role; label: string; description: string }> = [
  {
    value: "STAKEHOLDER",
    label: "Stakeholder",
    description: "Trader, manufacturer, dealer, repairer, importer, or packer",
  },
  {
    value: "ADMIN",
    label: "Administrator",
    description: "Super or regional administration access",
  },
  {
    value: "LMO_GATC",
    label: "LMO / GATC",
    description:
      "Legal Metrology Officer or Government Approved Test Centre operations",
  },
];

const initialFormData: RegistrationFormData = {
  fullName: "",
  mobile: "",
  email: "",
  password: "",
  businessName: "",
  category: "",
  pan: "",
  gstin: "",
  legalBusinessName: "",
  tradeName: "",
  stateCode: "",
  registeredAddress: "",
  employeeId: "",
  tradeLicenseNo: "",
  businessAddress: "",
  departmentName: "",
  designation: "",
  jurisdictionDistrict: "",
  jurisdictionState: "",
  otpSessionId: "",
  mobileOtp: "",
  emailOtp: "",
  lat: null,
  long: null,
};

export default function RegistrationPage() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [staffRole, setStaffRole] = useState<StaffRole | null>(null);
  const [formData, setFormData] = useState(initialFormData);
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, File>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [registration, setRegistration] = useState<RegistrationResponse | null>(
    null,
  );
  const [isOtpModalOpen, setIsOtpModalOpen] = useState(false);
  const [isIdentityVerified, setIsIdentityVerified] = useState(false);
  const [registrationError, setRegistrationError] = useState<string>();
  const { request } = useGatewayApi();

  const progress = ((currentStep + 1) / steps.length) * 100;
  const selectedRoleLabel = useMemo(
    () => roles.find((role) => role.value === selectedRole)?.label,
    [selectedRole],
  );
  const resolvedRole: SupportedRegistrationRole | null =
    selectedRole === "LMO_GATC" ? staffRole : selectedRole;

  const updateField = (field: keyof RegistrationFormData, value: string) => {
    setRegistrationError(undefined);
    setFormData((current) => ({ ...current, [field]: value }));
  };

  const handleFileSelected = (docType: string, file: File) => {
    setUploadedFiles((current) => ({ ...current, [docType]: file }));
  };

  const handleGstinVerified = (businessData: GstinBusinessData) => {
    const address = [
      businessData.address.buildingNumber,
      businessData.address.buildingName,
      businessData.address.floorNumber,
      businessData.address.street,
      businessData.address.location,
      businessData.address.district,
      businessData.address.city,
      businessData.address.state,
      businessData.address.pincode,
    ]
      .filter(Boolean)
      .join(", ");
    setFormData((current) => ({
      ...current,
      legalBusinessName: businessData.legalName,
      tradeName: businessData.tradeName,
      stateCode: businessData.stateCode,
      registeredAddress: address,
      businessAddress: address,
    }));
  };

  const getLocation = () => {
    if (!navigator.geolocation) {
      setRegistrationError("Geolocation is not supported by your browser.");
      return;
    }
    setRegistrationError(undefined);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setFormData((current) => ({
          ...current,
          lat: position.coords.latitude,
          long: position.coords.longitude,
        }));
      },
      (error) => {
        console.error(error);
        setRegistrationError("Unable to get your location. Please allow location access.");
      }
    );
  };

  const canContinue = () => {
    if (currentStep === 0) return selectedRole !== null;
    if (currentStep === 1) {
      return Boolean(
        formData.fullName &&
        /^[A-Za-z][A-Za-z .'-]{2,99}$/.test(formData.fullName) &&
        /^[6-9]\d{9}$/.test(formData.mobile) &&
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email) &&
        formData.password.length >= 8 &&
        formData.password.length <= 128 &&
        (selectedRole === "STAKEHOLDER"
          ? formData.businessName.trim().length >= 2 &&
            Boolean(formData.category)
          : Boolean(resolvedRole) && formData.employeeId.trim().length >= 1) &&
        (resolvedRole === "GATC_PRINCIPAL" ? formData.lat !== null && formData.long !== null : true)
      );
    }

    if (currentStep === 2) {
      return Boolean(formData.pan || formData.gstin || formData.employeeId);
    }
    return Boolean(formData.mobileOtp && formData.emailOtp);
  };

  const submitRegistration = async () => {
    if (!resolvedRole) return;
    setIsSubmitting(true);
    setRegistrationError(undefined);
    try {
      const payload = new FormData();
      payload.append("role", resolvedRole);
      Object.entries(formData).forEach(([key, value]) => {
        if (!["otpSessionId", "mobileOtp", "emailOtp"].includes(key) && value !== null && value !== "") {
          payload.append(key, String(value));
        }
      });
      Object.entries(uploadedFiles).forEach(([field, file]) => {
        payload.append(field, file);
      });

      const result = await request<RegistrationResponse, FormData>({
        endpoint: "/api/v1/auth/register",
        method: "POST",
        data: payload,
        timeout: 30_000,
      });
      setRegistration(result);
      setFormData((current) => ({
        ...current,
        otpSessionId: result.otpSessionId,
      }));
      setCurrentStep(3);
      setIsOtpModalOpen(true);
    } catch (error) {
      const responseData =
        error && typeof error === "object" && "responseData" in error
          ? (error.responseData as
              { details?: Record<string, string[]> } | undefined)
          : undefined;
      const detailMessage = responseData?.details
        ? Object.entries(responseData.details)
            .flatMap(([field, messages]) =>
              messages.map((message) => `${field}: ${message}`),
            )
            .join(" ")
        : undefined;
      const message =
        detailMessage ||
        (error && typeof error === "object" && "message" in error
          ? String(error.message)
          : "Unable to submit registration.");
      setRegistrationError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNext = async (event: FormEvent) => {
    event.preventDefault();
    if (!canContinue()) return;
    if (currentStep === 2) {
      await submitRegistration();
      return;
    }
    if (currentStep === 3) return;
    setCurrentStep((step) => Math.min(step + 1, steps.length - 1));
  };

  return (
    <main className="min-h-screen bg-[#F5F7FA] px-4 py-8 text-[#1A1A2E] sm:px-6">
      <div className="mx-auto max-w-5xl">
        <header className="mb-8 text-center">
          <div className="mb-3 flex justify-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
              <UserRound className="h-6 w-6" />
            </div>
          </div>
          <h1 className="text-3xl font-bold">Create your eMaap account</h1>
          <p className="mt-2 text-sm text-[#5C5C70]">
            Complete the registration steps to request access.
          </p>
        </header>

        <Card className="border-[#E0E0E0] shadow-sm">
          <CardHeader className="space-y-5">
            <div className="flex items-center justify-between gap-3">
              {steps.map((step, index) => (
                <div key={step} className="flex min-w-0 items-center gap-2">
                  <div
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${
                      index <= currentStep
                        ? "bg-primary text-primary-foreground"
                        : "bg-[#EEF0F3] text-[#8A8A98]"
                    }`}
                  >
                    {index < currentStep ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      index + 1
                    )}
                  </div>
                  <span
                    className={`hidden truncate text-xs font-medium sm:block ${
                      index === currentStep ? "text-primary" : "text-[#8A8A98]"
                    }`}
                  >
                    {step}
                  </span>
                </div>
              ))}
            </div>
            <Progress value={progress} />
          </CardHeader>

          <CardContent>
            <form onSubmit={handleNext} className="space-y-6">
              {currentStep === 0 && (
                <section className="space-y-4">
                  <div>
                    <h2 className="text-xl font-semibold">Choose your role</h2>
                    <p className="mt-1 text-sm text-[#5C5C70]">
                      Your role determines the information required in later
                      steps.
                    </p>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {roles.map((role) => (
                      <button
                        key={role.value}
                        type="button"
                        onClick={() => {
                          setSelectedRole(role.value);
                          if (role.value !== "LMO_GATC") setStaffRole(null);
                        }}
                        className={`rounded-xl border p-4 text-left transition ${
                          selectedRole === role.value
                            ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                            : "border-[#E0E0E0] hover:border-primary/50"
                        }`}
                      >
                        <p className="font-semibold">{role.label}</p>
                        <p className="mt-1 text-sm text-[#5C5C70]">
                          {role.description}
                        </p>
                      </button>
                    ))}
                  </div>
                </section>
              )}

              {currentStep === 1 && selectedRole && (
                <section className="space-y-5">
                  <div>
                    <h2 className="text-xl font-semibold">
                      Demographic & business details
                    </h2>
                    <p className="mt-1 text-sm text-[#5C5C70]">
                      Registering as {selectedRoleLabel ?? "a new user"}.
                    </p>
                  </div>
                  {selectedRole === "LMO_GATC" && (
                    <div className="max-w-md space-y-2">
                      <label
                        htmlFor="staff-registration-role"
                        className="text-sm font-medium"
                      >
                        Registration type
                      </label>
                      <select
                        id="staff-registration-role"
                        className="h-10 w-full rounded-md border border-[#E0E0E0] bg-white px-3 text-sm"
                        value={staffRole ?? ""}
                        onChange={(event) =>
                          setStaffRole(
                            (event.target.value || null) as StaffRole | null,
                          )
                        }
                      >
                        <option value="">Select LMO or GATC</option>
                        <option value="LMO">LMO</option>x
                        <option value="GATC_PRINCIPAL">GATC</option>
                      </select>
                    </div>
                  )}
                  {resolvedRole && (
                    <RoleFormRenderer
                      role={resolvedRole}
                      section="demographic"
                      values={formData}
                      files={uploadedFiles}
                      onChange={updateField}
                      onFileSelected={handleFileSelected}
                      onGstinVerified={handleGstinVerified}
                    />
                  )}
                  {resolvedRole === "GATC_PRINCIPAL" && (
                    <div className="rounded-lg border border-[#E0E0E0] p-4 bg-white">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="text-sm font-semibold text-[#1A1A2E]">Test Centre Location</p>
                          <p className="text-xs text-[#5C5C70]">Capture the exact coordinates of the GATC.</p>
                        </div>
                        <Button
                          type="button"
                          variant={formData.lat !== null && formData.long !== null ? "default" : "outline"}
                          size="sm"
                          onClick={getLocation}
                          className="w-full sm:w-auto"
                        >
                          <MapPin className="mr-2 h-4 w-4" />
                          {formData.lat !== null && formData.long !== null ? "Location Captured" : "Capture Location"}
                        </Button>
                      </div>
                      {formData.lat !== null && formData.long !== null && (
                        <p className="mt-2 text-xs font-medium text-green-600">
                          Coordinates: {formData.lat}, {formData.long}
                        </p>
                      )}
                    </div>
                  )}
                  {registrationError && (
                    <p
                      className="rounded-md bg-destructive/10 p-3 text-sm text-destructive"
                      role="alert"
                    >
                      {registrationError}
                    </p>
                  )}
                </section>
              )}

              {currentStep === 2 && selectedRole && resolvedRole && (
                <section className="space-y-5">
                  <div>
                    <h2 className="text-xl font-semibold">
                      Identity verification
                    </h2>
                    <p className="mt-1 text-sm text-[#5C5C70]">
                      Add identity details and supporting documents for review.
                    </p>
                  </div>
                  <RoleFormRenderer
                    role={resolvedRole}
                    section="identity"
                    values={formData}
                    files={uploadedFiles}
                    onChange={updateField}
                    onFileSelected={handleFileSelected}
                    onGstinVerified={handleGstinVerified}
                  />
                  {registrationError && (
                    <p
                      className="rounded-md bg-destructive/10 p-3 text-sm text-destructive"
                      role="alert"
                    >
                      {registrationError}
                    </p>
                  )}
                </section>
              )}

              {currentStep === 3 && (
                <section className="space-y-5">
                  <div className="flex items-center gap-3">
                    <ShieldCheck className="h-6 w-6 text-primary" />
                    <div>
                      <h2 className="text-xl font-semibold">
                        Verify and complete
                      </h2>
                      <p className="text-sm text-[#5C5C70]">
                        Enter both codes sent to your mobile and email.
                      </p>
                    </div>
                  </div>
                  {registration && (
                    <div className="rounded-md bg-primary/5 p-4 text-sm">
                      <p>
                        Application {registration.applicationId} is ready for
                        OTP verification.
                      </p>
                      <Button
                        type="button"
                        className="mt-3"
                        onClick={() => setIsOtpModalOpen(true)}
                      >
                        {isIdentityVerified
                          ? "View verification result"
                          : "Open OTP verification"}
                      </Button>
                    </div>
                  )}
                </section>
              )}

              <div className="flex justify-between gap-3 border-t border-[#EEF0F3] pt-5">
                <Button
                  type="button"
                  variant="outline"
                  disabled={isSubmitting}
                  onClick={() => {
                    if (currentStep === 0) {
                      navigate("/");
                    } else {
                      setCurrentStep((step) => Math.max(0, step - 1));
                    }
                  }}
                >
                  {currentStep === 0 ? "Back to Login" : "Back"}
                </Button>
                {currentStep < 3 ? (
                  <Button
                    type="submit"
                    disabled={!canContinue() || isSubmitting}
                  >
                    {isSubmitting
                      ? "Submitting..."
                      : currentStep === 2
                        ? "Submit registration"
                        : "Continue"}
                  </Button>
                ) : null}
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
      {registration && (
        <DualOtpModal
          open={isOtpModalOpen}
          onOpenChange={setIsOtpModalOpen}
          sessionId={registration.otpSessionId}
          mobileNumber={formData.mobile}
          emailAddress={formData.email}
          referenceId={registration.applicationId}
          onVerified={() => {
            setIsIdentityVerified(true);
            setIsOtpModalOpen(false);
            navigate("/");
          }}
        />
      )}
    </main>
  );
}
