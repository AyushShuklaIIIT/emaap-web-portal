import type { ReactNode } from "react";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { DocumentUploadField } from "@/components/registration/DocumentUploadField";
import {
  GstinVerificationInput,
  type GstinBusinessData,
} from "@/components/registration/GstinVerificationInput";

export type SupportedRegistrationRole =
  "STAKEHOLDER" | "ADMIN" | "LMO" | "GATC_OPERATOR";

export interface RoleFormValues {
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
  tradeLicenseNo: string;
  businessAddress: string;
  employeeId: string;
  departmentName: string;
  designation: string;
  jurisdictionState: string;
}

interface RoleFormRendererProps {
  role: SupportedRegistrationRole;
  section: "demographic" | "identity";
  values: RoleFormValues;
  files: Record<string, File>;
  onChange: (field: keyof RoleFormValues, value: string) => void;
  onFileSelected: (docType: string, file: File) => void;
  onGstinVerified: (businessData: GstinBusinessData) => void;
}

export function RoleFormRenderer({
  role,
  section,
  values,
  files,
  onChange,
  onFileSelected,
  onGstinVerified,
}: RoleFormRendererProps) {
  if (section === "demographic") {
    return (
      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label={role === "STAKEHOLDER" ? "Contact name" : "Official name"}
          hint="3–100 letters; spaces, apostrophes, periods, and hyphens are allowed."
          required
        >
          <Input
            value={values.fullName}
            onChange={(event) => onChange("fullName", event.target.value)}
          />
        </Field>
        <Field
          label="Mobile number"
          hint="Enter a 10-digit Indian mobile number starting with 6, 7, 8, or 9."
          required
        >
          <Input
            inputMode="numeric"
            maxLength={10}
            value={values.mobile}
            onChange={(event) => onChange("mobile", event.target.value)}
          />
        </Field>
        <Field
          label="Email address"
          hint="Use a valid email address, for example name@example.com."
          required
        >
          <Input
            type="email"
            value={values.email}
            onChange={(event) => onChange("email", event.target.value)}
          />
        </Field>
        <Field label="Password" hint="8–128 characters." required>
          <PasswordInput
            minLength={8}
            maxLength={128}
            value={values.password}
            onChange={(event) => onChange("password", event.target.value)}
          />
        </Field>
        {role === "STAKEHOLDER" ? (
          <>
            <Field
              label="Business name"
              hint="Enter at least 2 characters."
              required
            >
              <Input
                value={values.businessName}
                onChange={(event) =>
                  onChange("businessName", event.target.value)
                }
              />
            </Field>
            <Field
              label="Legal business name"
            >
              <Input
                value={values.legalBusinessName}
                placeholder="Will be filled in next step using GSTIN"
                readOnly
                disabled={Boolean(values.legalBusinessName)}
              />
            </Field>
            <Field
              label="Trade name"
            >
              <Input
                value={values.tradeName}
                placeholder="Will be filled in next step using GSTIN"
                readOnly
                disabled={Boolean(values.tradeName)}
              />
            </Field>
            <Field label="Category" required>
              <select
                className="h-10 rounded-md border border-[#E0E0E0] px-3 text-sm"
                value={values.category}
                onChange={(event) => onChange("category", event.target.value)}
              >
                <option value="">Select category</option>
                {[
                  "TRADER",
                  "MANUFACTURER",
                  "DEALER",
                  "REPAIRER",
                  "IMPORTER",
                  "PACKER",
                ].map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Business address">
              <Input
                value={values.businessAddress}
                readOnly={Boolean(values.registeredAddress)}
                disabled={Boolean(values.registeredAddress)}
                onChange={(event) =>
                  onChange("businessAddress", event.target.value)
                }
              />
            </Field>
          </>
        ) : (
          <>
            <Field
              label="Department name"
              hint="Use the official department name; letters, numbers, spaces, and punctuation are allowed."
            >
              <Input
                value={values.departmentName}
                onChange={(event) =>
                  onChange("departmentName", event.target.value)
                }
              />
            </Field>
            <Field
              label={
                role === "ADMIN"
                  ? "Designation"
                  : "Station / district jurisdiction"
              }
              hint={
                role === "ADMIN"
                  ? "Enter your official designation."
                  : "Enter the station, district, or jurisdiction name."
              }
            >
              <Input
                value={
                  role === "ADMIN"
                    ? values.designation
                    : values.jurisdictionState
                }
                onChange={(event) =>
                  onChange(
                    role === "ADMIN" ? "designation" : "jurisdictionState",
                    event.target.value,
                  )
                }
              />
            </Field>
          </>
        )}
        {role !== "STAKEHOLDER" && (
          <Field
            label="Employee ID"
            hint="Required for Admin and LMO/GATC; 1–100 non-space characters."
            required
          >
            <Input
              value={values.employeeId}
              onChange={(event) => onChange("employeeId", event.target.value)}
            />
          </Field>
        )}
        {role === "STAKEHOLDER" && (
          <Field label="Jurisdiction state">
            <Input
              value={values.jurisdictionState}
              onChange={(event) =>
                onChange("jurisdictionState", event.target.value)
              }
            />
          </Field>
        )}
      </div>
    );
  }

  if (role === "STAKEHOLDER") {
    return (
      <div className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="PAN"
            hint="10 characters: 5 uppercase letters, 4 digits, then 1 uppercase letter."
          >
            <Input
              maxLength={10}
              value={values.pan}
              onChange={(event) =>
                onChange("pan", event.target.value.toUpperCase())
              }
            />
          </Field>
          <GstinVerificationInput
            value={values.gstin}
            onChange={(value) => onChange("gstin", value)}
            onVerified={onGstinVerified}
          />
          <Field
            label="State code"
            hint="Use the 2-digit GST state code, for example 09."
          >
            <Input
              value={values.stateCode}
              readOnly={Boolean(values.registeredAddress)}
              disabled={Boolean(values.registeredAddress)}
              onChange={(event) => onChange("stateCode", event.target.value)}
            />
          </Field>
          <Field label="Trade license number" hint="Up to 100 characters.">
            <Input
              value={values.tradeLicenseNo}
              onChange={(event) =>
                onChange("tradeLicenseNo", event.target.value)
              }
            />
          </Field>
        </div>
        <DocumentUploadField
          docType="tradeLicense"
          label="Trade license PDF"
          allowedTypes={["pdf"]}
          selectedFile={files.tradeLicense}
          onFileSelected={(file) => onFileSelected("tradeLicense", file)}
        />
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <DocumentUploadField
        docType="idProof"
        label="Official ID proof"
        allowedTypes={["pdf", "jpg", "png"]}
        selectedFile={files.idProof}
        onFileSelected={(file) => onFileSelected("idProof", file)}
      />
      <DocumentUploadField
        docType={
          role === "GATC_OPERATOR" ? "gazetteDutyOrder" : "authorizationLetter"
        }
        label={
          role === "GATC_OPERATOR"
            ? "Duty authorization order"
            : "Authorization / nomination letter"
        }
        allowedTypes={["pdf", "jpg", "png"]}
        selectedFile={
          files[
            role === "GATC_OPERATOR"
              ? "gazetteDutyOrder"
              : "authorizationLetter"
          ]
        }
        onFileSelected={(file) =>
          onFileSelected(
            role === "GATC_OPERATOR"
              ? "gazetteDutyOrder"
              : "authorizationLetter",
            file,
          )
        }
      />
    </div>
  );
}

function Field({
  label,
  hint,
  required,
  children,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label>
        {label}
        {required && <span className="ml-1 text-destructive">*</span>}
      </Label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
