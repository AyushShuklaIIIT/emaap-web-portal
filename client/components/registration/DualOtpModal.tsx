import { useState } from "react";
import { Mail, MessageSquare } from "lucide-react";
import { useGatewayApi } from "@/contexts/GatewayApiContext";
import { BaseOtpModal, type OtpConfig } from "@/components/emaap/BaseOtpModal";

interface OtpResponse {
  mobileVerified: boolean;
  emailVerified: boolean;
  verified: boolean;
  expiresAt: string;
}

interface DualOtpModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sessionId: string;
  mobileNumber: string;
  emailAddress: string;
  referenceId: string;
  onVerified: () => void;
}

export function DualOtpModal({
  open,
  onOpenChange,
  sessionId,
  mobileNumber,
  emailAddress,
  referenceId,
  onVerified,
}: DualOtpModalProps) {
  const { request, isLoading } = useGatewayApi();
  const [mobileOtp, setMobileOtp] = useState("");
  const [emailOtp, setEmailOtp] = useState("");
  const [isVerified, setIsVerified] = useState(false);
  const [error, setError] = useState<string>();

  const resend = async (channel: "mobile" | "email") => {
    setError(undefined);
    try {
      await request({
        endpoint: "/api/v1/auth/resend-otp",
        method: "POST",
        data: { sessionId, mobileNumber, emailAddress },
        timeout: 15_000,
      });
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to resend OTP");
    }
  };

  const verify = async () => {
    setError(undefined);
    try {
      const result = await request<OtpResponse>({
        endpoint: "/api/v1/auth/verify-otp",
        method: "POST",
        data: { sessionId, mobileOtp, emailOtp },
        timeout: 15_000,
      });
      if (!result.verified) {
        setError("Both OTPs must be verified before continuing.");
        return;
      }
      setIsVerified(true);
      onVerified();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to verify OTPs");
    }
  };

  const otpConfigs: OtpConfig[] = [
    {
      label: "Mobile OTP",
      type: "mobile",
      target: mobileNumber,
      value: mobileOtp,
      maxLength: 6,
      icon: <MessageSquare className="h-4 w-4" />,
      onChange: (value) => setMobileOtp(value.replace(/\D/g, "").slice(0, 6)),
      onResend: () => void resend("mobile"),
    },
    {
      label: "Email OTP",
      type: "email",
      target: emailAddress,
      value: emailOtp,
      maxLength: 8,
      icon: <Mail className="h-4 w-4" />,
      onChange: (value) => setEmailOtp(value.replace(/[^A-Za-z0-9]/g, "").slice(0, 8).toUpperCase()),
      onResend: () => void resend("email"),
    },
  ];

  return (
    <BaseOtpModal
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v);
        if (!v) {
          setMobileOtp("");
          setEmailOtp("");
          setIsVerified(false);
        }
      }}
      title="Verify your identity"
      description="Enter the separate codes sent to your mobile number and email address."
      successTitle="Identity Verified!"
      successDescription={`Application submitted for Admin Review. Reference ID: ${referenceId}`}
      isVerified={isVerified}
      error={error}
      isLoading={isLoading}
      otpConfigs={otpConfigs}
      onVerify={() => void verify()}
    />
  );
}
