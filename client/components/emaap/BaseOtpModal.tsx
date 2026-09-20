import { useEffect, useMemo, useState, type ReactNode } from "react";
import { CheckCircle2, Clock3, Mail, MessageSquare, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";

const OTP_TTL_SECONDS = 5 * 60;
const RESEND_COOLDOWN_SECONDS = 60;

export interface OtpConfig {
  label: string;
  type: "mobile" | "email";
  target: string;
  value: string;
  maxLength: number;
  icon?: ReactNode;
  onChange: (value: string) => void;
  onResend: () => void;
  useSlotStyle?: boolean;
}

interface BaseOtpModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  successTitle?: string;
  successDescription?: string;
  isVerified?: boolean;
  error?: string;
  isLoading?: boolean;
  otpConfigs: OtpConfig[];
  onVerify: () => void;
}

export function BaseOtpModal({
  open,
  onOpenChange,
  title = "Verify your identity",
  description = "Enter the verification code(s).",
  successTitle = "Identity Verified!",
  successDescription = "Verification successful.",
  isVerified = false,
  error,
  isLoading,
  otpConfigs,
  onVerify,
}: BaseOtpModalProps) {
  const [remainingTime, setRemainingTime] = useState<Record<string, number>>({});
  const [cooldownTime, setCooldownTime] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!open) return;
    const initialRemaining: Record<string, number> = {};
    const initialCooldown: Record<string, number> = {};
    for (const conf of otpConfigs) {
      initialRemaining[conf.type] = OTP_TTL_SECONDS;
      initialCooldown[conf.type] = 0;
    }
    setRemainingTime(initialRemaining);
    setCooldownTime(initialCooldown);
  }, [open, otpConfigs.length]);

  useEffect(() => {
    if (!open || isVerified) return;
    const timer = window.setInterval(() => {
      setRemainingTime((prev) => {
        const next = { ...prev };
        Object.keys(next).forEach((k) => (next[k] = Math.max(0, next[k] - 1)));
        return next;
      });
      setCooldownTime((prev) => {
        const next = { ...prev };
        Object.keys(next).forEach((k) => (next[k] = Math.max(0, next[k] - 1)));
        return next;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [open, isVerified]);

  const formatTime = (seconds: number) =>
    `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;

  const minRemaining = Math.min(...Object.values(remainingTime), OTP_TTL_SECONDS);
  const progress = useMemo(
    () => Math.min(100, ((OTP_TTL_SECONDS - minRemaining) / OTP_TTL_SECONDS) * 100),
    [minRemaining],
  );

  const canVerify = otpConfigs.every((conf) => {
    if (conf.type === "mobile") return conf.value.length === conf.maxLength;
    if (conf.type === "email") return /^[A-Za-z0-9]{6,8}$/.test(conf.value);
    return conf.value.length > 0;
  });

  const anyExpired = Object.values(remainingTime).some((time) => time === 0);

  const handleResend = (conf: OtpConfig) => {
    if (cooldownTime[conf.type] > 0) return;
    conf.onResend();
    setCooldownTime((prev) => ({ ...prev, [conf.type]: RESEND_COOLDOWN_SECONDS }));
    setRemainingTime((prev) => ({ ...prev, [conf.type]: OTP_TTL_SECONDS }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={otpConfigs.length > 1 ? "sm:max-w-lg" : "sm:max-w-md"}>
        <DialogHeader className="items-center text-center">
          <div className="mb-1 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            {isVerified ? <CheckCircle2 className="h-6 w-6 text-green-600" /> : <ShieldCheck className="h-6 w-6" />}
          </div>
          <DialogTitle className="text-xl">{isVerified ? successTitle : title}</DialogTitle>
          <DialogDescription>{isVerified ? successDescription : description}</DialogDescription>
        </DialogHeader>

        {isVerified ? (
          <div className="rounded-lg bg-green-50 p-4 text-center text-sm text-green-800">
            {successDescription}
          </div>
        ) : (
          <div className="space-y-5">
            {otpConfigs.length > 1 && (
              <Progress value={progress} className="h-2" aria-label="OTP validity elapsed" />
            )}
            <div className={`grid gap-4 ${otpConfigs.length > 1 ? "sm:grid-cols-2" : "flex flex-col items-center py-2"}`}>
              {otpConfigs.map((conf) => (
                <OtpEntry
                  key={conf.type}
                  config={conf}
                  remaining={remainingTime[conf.type] ?? OTP_TTL_SECONDS}
                  cooldown={cooldownTime[conf.type] ?? 0}
                  onResend={() => handleResend(conf)}
                  formatTime={formatTime}
                />
              ))}
            </div>
            {error && <p className="text-sm text-destructive" role="alert">{error}</p>}
            <Button
              className={otpConfigs.length === 1 ? "w-full bg-saffron text-saffron-foreground hover:bg-saffron/90" : "w-full"}
              disabled={!canVerify || anyExpired || isLoading}
              onClick={onVerify}
            >
              {isLoading ? "Verifying..." : "Verify & Continue"}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function OtpEntry({
  config,
  remaining,
  cooldown,
  onResend,
  formatTime,
}: {
  config: OtpConfig;
  remaining: number;
  cooldown: number;
  onResend: () => void;
  formatTime: (seconds: number) => string;
}) {
  const expired = remaining === 0;

  if (config.useSlotStyle) {
    return (
      <div className="flex flex-col items-center gap-5 w-full">
        <InputOTP maxLength={config.maxLength} value={config.value} onChange={config.onChange}>
          <InputOTPGroup>
            {Array.from({ length: config.maxLength }).map((_, i) => (
              <InputOTPSlot key={i} index={i} className="h-12 w-11 text-base" />
            ))}
          </InputOTPGroup>
        </InputOTP>
        <p className="text-sm text-muted-foreground">
          Didn't receive the code?{" "}
          <button
            className="font-medium text-primary hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={cooldown > 0}
            onClick={onResend}
          >
            {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend OTP"}
          </button>
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2 rounded-lg border p-3">
      <Label htmlFor={`${config.label}-otp`} className="flex items-center gap-2">
        {config.icon}
        {config.label}
      </Label>
      <Input
        id={`${config.label}-otp`}
        value={config.value}
        maxLength={config.maxLength}
        inputMode={config.type === "mobile" ? "numeric" : "text"}
        autoComplete="one-time-code"
        onChange={(event) => config.onChange(event.target.value)}
        aria-describedby={`${config.label}-description`}
        className="text-center text-lg tracking-[0.3em]"
      />
      <p id={`${config.label}-description`} className="truncate text-xs text-muted-foreground">
        Sent to {config.target}
      </p>
      <p className={`flex items-center gap-1 text-xs ${expired ? "text-destructive" : "text-muted-foreground"}`}>
        <Clock3 className="h-3.5 w-3.5" aria-hidden="true" />
        {expired ? "Code expired" : `Expires in ${formatTime(remaining)}`}
      </p>
      <Button type="button" variant="link" className="h-auto p-0 text-xs" disabled={cooldown > 0 || expired} onClick={onResend}>
        {cooldown > 0 ? `Resend in ${cooldown}s` : `Resend ${config.label}`}
      </Button>
    </div>
  );
}
