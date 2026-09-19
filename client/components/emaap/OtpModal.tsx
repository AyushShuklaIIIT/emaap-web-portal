import { useState } from "react";
import { BaseOtpModal, type OtpConfig } from "@/components/emaap/BaseOtpModal";

export function OtpModal({
  open,
  onOpenChange,
  phone,
  onVerified,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  phone: string;
  onVerified: () => void;
}) {
  const [otp, setOtp] = useState("");

  const otpConfigs: OtpConfig[] = [
    {
      label: "Mobile OTP",
      type: "mobile",
      target: phone,
      value: otp,
      maxLength: 6,
      useSlotStyle: true,
      onChange: (value) => setOtp(value.replace(/\D/g, "").slice(0, 6)),
      onResend: () => {
        // Implement single OTP resend logic
      },
    },
  ];

  return (
    <BaseOtpModal
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v);
        if (!v) setOtp("");
      }}
      title="Two-Factor Authentication"
      description={`Enter the 6-digit code sent to ${phone}`}
      successTitle="Verified!"
      successDescription="Authentication successful."
      isVerified={false} // Would normally track if verified here
      otpConfigs={otpConfigs}
      onVerify={onVerified}
    />
  );
}
