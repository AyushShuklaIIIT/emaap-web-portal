import { useState } from "react";
import { CheckCircle2, LoaderCircle, ShieldAlert } from "lucide-react";
import { useGatewayApi } from "@/contexts/GatewayApiContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const GSTIN_PATTERN = /^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;

export type GstinVerificationState = "IDLE" | "VERIFYING" | "VALID" | "INVALID";

export interface GstinBusinessData {
  gstin: string;
  legalName: string;
  tradeName: string;
  taxpayerType: string;
  activeStatus: "ACTIVE" | "SUSPENDED" | "CANCELLED" | "UNKNOWN";
  stateCode: string;
  address: {
    buildingName?: string;
    buildingNumber?: string;
    floorNumber?: string;
    street?: string;
    location?: string;
    district?: string;
    city?: string;
    state?: string;
    stateCode: string;
    pincode?: string;
  };
}

interface GstinVerificationInputProps {
  value: string;
  onChange: (value: string) => void;
  onVerified: (businessData: GstinBusinessData) => void;
}

export function GstinVerificationInput({
  value,
  onChange,
  onVerified,
}: GstinVerificationInputProps) {
  const { request } = useGatewayApi();
  const [verificationState, setVerificationState] =
    useState<GstinVerificationState>("IDLE");
  const [businessData, setBusinessData] = useState<GstinBusinessData>();
  const [error, setError] = useState<string>();

  const verify = async () => {
    const gstin = value.replace(/\s/g, "").toUpperCase();
    onChange(gstin);
    setBusinessData(undefined);
    setError(undefined);

    if (!GSTIN_PATTERN.test(gstin)) {
      setVerificationState("INVALID");
      setError("Enter a valid 15-character GSTIN.");
      return;
    }

    setVerificationState("VERIFYING");
    try {
      const result = await request<GstinBusinessData>({
        endpoint: "/api/v1/gateway/gstn/verify",
        method: "POST",
        data: { gstin },
        timeout: 30_000,
      });
      setBusinessData(result);
      setVerificationState("VALID");
      onVerified(result);
    } catch (requestError) {
      setVerificationState("INVALID");
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to verify GSTIN.",
      );
    }
  };

  const statusClass =
    businessData?.activeStatus === "ACTIVE"
      ? "border-green-200 bg-green-50 text-green-800"
      : "border-red-200 bg-red-50 text-red-800";

  return (
    <div className="space-y-2 sm:col-span-2">
      <Label htmlFor="gstin">GSTIN</Label>
      <div className="flex gap-2">
        <Input
          id="gstin"
          maxLength={15}
          value={value}
          aria-invalid={verificationState === "INVALID"}
          onChange={(event) => {
            onChange(event.target.value.toUpperCase());
            setVerificationState("IDLE");
            setBusinessData(undefined);
            setError(undefined);
          }}
        />
        <Button
          type="button"
          variant="outline"
          className="shrink-0"
          disabled={verificationState === "VERIFYING" || !value}
          onClick={() => void verify()}
        >
          {verificationState === "VERIFYING" ? (
            <LoaderCircle className="h-4 w-4 animate-spin" />
          ) : (
            "Verify GSTIN"
          )}
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        15 characters: 2-digit state code, 5 uppercase letters, 4 digits, 1 uppercase letter, 1 alphanumeric character, Z, and 1 alphanumeric character.
      </p>

      {verificationState === "INVALID" && error && (
        <p className="flex items-center gap-1 text-xs text-destructive" role="alert">
          <ShieldAlert className="h-3.5 w-3.5" aria-hidden="true" />
          {error}
        </p>
      )}

      {verificationState === "VALID" && businessData && (
        <div className={`rounded-md border p-3 text-sm ${statusClass}`}>
          <div className="flex items-center justify-between gap-2">
            <p className="flex items-center gap-1 font-medium">
              <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
              GSTIN verified
            </p>
            <span className="rounded-full border px-2 py-0.5 text-xs font-semibold">
              {businessData.activeStatus}
            </span>
          </div>
          <dl className="mt-2 grid gap-x-4 gap-y-1 text-xs sm:grid-cols-2">
            <div>
              <dt className="font-medium">Legal name</dt>
              <dd>{businessData.legalName}</dd>
            </div>
            <div>
              <dt className="font-medium">Trade name</dt>
              <dd>{businessData.tradeName}</dd>
            </div>
            <div>
              <dt className="font-medium">State code</dt>
              <dd>{businessData.stateCode}</dd>
            </div>
            <div>
              <dt className="font-medium">Registered address</dt>
              <dd>
                {[
                  businessData.address.buildingNumber,
                  businessData.address.street,
                  businessData.address.location,
                  businessData.address.district,
                  businessData.address.state,
                  businessData.address.pincode,
                ]
                  .filter(Boolean)
                  .join(", ") || "Address supplied by GSTN"}
              </dd>
            </div>
          </dl>
        </div>
      )}
    </div>
  );
}
