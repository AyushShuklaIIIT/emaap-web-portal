import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { Button } from "@/components/ui/button";
import { ShieldCheck } from "lucide-react";

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

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v);
        if (!v) setOtp("");
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="items-center text-center">
          <div className="mb-1 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <DialogTitle className="text-xl">
            Two-Factor Authentication
          </DialogTitle>
          <DialogDescription>
            Enter the 6-digit code sent to <strong>{phone}</strong>
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-center gap-5 py-2">
          <InputOTP maxLength={6} value={otp} onChange={setOtp}>
            <InputOTPGroup>
              {Array.from({ length: 6 }).map((_, i) => (
                <InputOTPSlot key={i} index={i} className="h-12 w-11 text-base" />
              ))}
            </InputOTPGroup>
          </InputOTP>
          <p className="text-sm text-muted-foreground">
            Didn't receive the code?{" "}
            <button className="font-medium text-primary hover:underline">
              Resend OTP
            </button>
          </p>
          <Button
            className="w-full bg-saffron text-saffron-foreground hover:bg-saffron/90"
            disabled={otp.length !== 6}
            onClick={onVerified}
          >
            Verify &amp; Continue
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
