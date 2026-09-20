import { useState } from "react";
import { CheckCircle2, LoaderCircle, ShieldAlert } from "lucide-react";
import { useGatewayApi } from "@/contexts/GatewayApiContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

export const PAN_PATTERN = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;

export type PanVerificationState = "IDLE" | "VERIFYING" | "VALID" | "INVALID";
export type EntityType = "INDIVIDUAL" | "COMPANY";

export interface PanVerificationData {
  panNumber: string;
  matchedName: string;
  category: string;
}

interface PanVerificationFieldProps {
  value: string;
  onChange: (value: string) => void;
  onVerified?: (data: PanVerificationData) => void;
}

export function PanVerificationField({
  value,
  onChange,
  onVerified,
}: PanVerificationFieldProps) {
  const { request } = useGatewayApi();
  const [entityType, setEntityType] = useState<EntityType>("INDIVIDUAL");
  const [verificationState, setVerificationState] = useState<PanVerificationState>("IDLE");
  const [matchedName, setMatchedName] = useState<string>();
  const [error, setError] = useState<string>();
  const [statusAlert, setStatusAlert] = useState<string>();

  const verify = async () => {
    const pan = value.replace(/\s/g, "").toUpperCase();
    onChange(pan);
    setMatchedName(undefined);
    setError(undefined);
    setStatusAlert(undefined);

    if (!PAN_PATTERN.test(pan)) {
      setVerificationState("INVALID");
      setError("Enter a valid 10-character PAN.");
      setStatusAlert("PAN Invalid");
      return;
    }

    setVerificationState("VERIFYING");
    try {
      const result = await request<PanVerificationData>({
        endpoint: "/api/v1/gateway/pan/verify",
        method: "POST",
        data: { panNumber: pan, entityType },
        timeout: 30_000,
      });
      setMatchedName(result.matchedName);
      setVerificationState("VALID");
      setStatusAlert("Name Matched");
      if (onVerified) {
        onVerified(result);
      }
    } catch (requestError: any) {
      setVerificationState("INVALID");
      const errMessage = requestError instanceof Error ? requestError.message : "Unable to verify PAN.";
      setError(errMessage);
      
      if (errMessage.toLowerCase().includes("category mismatch") || errMessage.toLowerCase().includes("tax category") || errMessage.toLowerCase().includes("entity type")) {
         setStatusAlert("Tax Category Mismatch");
      } else {
         setStatusAlert("PAN Invalid");
      }
    }
  };

  return (
    <div className="space-y-4 sm:col-span-2">
      <div className="space-y-2">
        <Label>Entity Type</Label>
        <RadioGroup
          value={entityType}
          onValueChange={(val) => {
            setEntityType(val as EntityType);
            setVerificationState("IDLE");
            setMatchedName(undefined);
            setError(undefined);
            setStatusAlert(undefined);
          }}
          className="flex gap-4"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="INDIVIDUAL" id="individual" />
            <Label htmlFor="individual" className="font-normal">
              Individual
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="COMPANY" id="company" />
            <Label htmlFor="company" className="font-normal">
              Company
            </Label>
          </div>
        </RadioGroup>
      </div>

      <div className="space-y-2">
        <Label htmlFor="pan">Permanent Account Number (PAN)</Label>
        <div className="flex gap-2">
          <Input
            id="pan"
            maxLength={10}
            value={value}
            aria-invalid={verificationState === "INVALID"}
            onChange={(event) => {
              onChange(event.target.value.toUpperCase());
              setVerificationState("IDLE");
              setMatchedName(undefined);
              setError(undefined);
              setStatusAlert(undefined);
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
              "Verify PAN"
            )}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          10 characters: 5 uppercase letters, 4 digits, 1 uppercase letter.
        </p>
      </div>

      {verificationState === "INVALID" && (
        <div className="rounded-md border p-3 text-sm border-red-200 bg-red-50 text-red-800" role="alert">
           <div className="flex items-center justify-between gap-2">
            <p className="flex items-center gap-1 font-medium">
              <ShieldAlert className="h-4 w-4" aria-hidden="true" />
              {statusAlert || "PAN Invalid"}
            </p>
          </div>
          {error && <p className="mt-1 text-xs">{error}</p>}
        </div>
      )}

      {verificationState === "VALID" && matchedName && (
        <div className="rounded-md border p-3 text-sm border-green-200 bg-green-50 text-green-800">
          <div className="flex items-center justify-between gap-2">
            <p className="flex items-center gap-1 font-medium">
              <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
              {statusAlert || "Name Matched"}
            </p>
          </div>
          <dl className="mt-2 grid gap-x-4 gap-y-1 text-xs">
            <div>
              <dt className="font-medium">Registered Name</dt>
              <dd>{matchedName}</dd>
            </div>
          </dl>
        </div>
      )}
    </div>
  );
}
