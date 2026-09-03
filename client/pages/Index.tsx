import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Gauge,
  ShieldCheck,
  BarChart3,
  Fuel,
  Weight,
  Building2,
} from "lucide-react";
import { TricolorBar } from "@/components/emaap/TricolorBar";
import { EmaapLogo } from "@/components/emaap/EmaapLogo";
import { OtpModal } from "@/components/emaap/OtpModal";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

type Role = "business" | "admin" | "gatc";

const ROLE_ROUTE: Record<Role, string> = {
  business: "/business/dashboard",
  admin: "/admin/dashboard",
  gatc: "/gatc/dashboard",
};

const ROLE_PLACEHOLDER: Record<Role, string> = {
  business: "e.g. Corporate registration mobile",
  admin: "e.g. Government official ID mobile",
  gatc: "e.g. LMO / GATC registered mobile",
};

export default function Index() {
  const navigate = useNavigate();
  const [role, setRole] = useState<Role>("business");
  const [phone, setPhone] = useState("");
  const [otpOpen, setOtpOpen] = useState(false);

  const handleSendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (phone.trim().length < 10) return;
    setOtpOpen(true);
  };

  const handleVerified = () => {
    setOtpOpen(false);
    navigate(ROLE_ROUTE[role]);
  };

  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <TricolorBar />
      <div className="grid flex-1 grid-cols-1 lg:grid-cols-2">
        {/* Left — brand / value proposition panel */}
        <div className="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-primary via-primary to-[#062a66] px-14 py-12 text-white lg:flex">
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.07]"
            style={{
              backgroundImage:
                "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
              backgroundSize: "28px 28px",
            }}
          />
          <EmaapLogo variant="light" />

          <div className="relative z-10 max-w-md">
            <p className="mb-3 inline-block rounded-full border border-white/25 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-white/90">
              Digital India · Dept. of Consumer Affairs
            </p>
            <h1 className="text-4xl font-extrabold leading-tight tracking-tight">
              One Nation.
              <br />
              One Measure.
              <br />
              One Portal.
            </h1>
            <p className="mt-4 text-sm leading-relaxed text-white/75">
              eMaap unifies India's Legal Metrology workflows — instrument
              registration, verification fees, field inspections and digital
              certification — into a single algorithmically-routed platform
              replacing fragmented state portals.
            </p>

            <div className="mt-8 flex flex-col gap-4">
              <Feature
                icon={Gauge}
                title="Single Pane of Glass"
                desc="Track every application, payment and certificate across all states in one dashboard."
              />
              <Feature
                icon={ShieldCheck}
                title="Automated Compliance Alerts"
                desc="Expiry reminders and pendency trackers keep every instrument audit-ready."
              />
              <Feature
                icon={BarChart3}
                title="Algorithmic Field Routing"
                desc="Applications are auto-assigned to the nearest available LMO or authorised GATC."
              />
            </div>
          </div>

          <div className="relative z-10 flex items-center gap-6 text-white/60">
            <div className="flex items-center gap-2 text-xs">
              <Fuel className="h-4 w-4" /> Fuel Dispensers
            </div>
            <div className="flex items-center gap-2 text-xs">
              <Weight className="h-4 w-4" /> Weighbridges
            </div>
            <div className="flex items-center gap-2 text-xs">
              <Building2 className="h-4 w-4" /> GATCs
            </div>
          </div>
        </div>

        {/* Right — login gateway */}
        <div className="flex flex-col items-center justify-center px-6 py-14 sm:px-10">
          <div className="mb-8 flex flex-col items-center gap-2 lg:hidden">
            <EmaapLogo />
          </div>

          <div className="w-full max-w-sm">
            <h2 className="text-2xl font-bold text-foreground">
              Login to eMaap
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Select your role to continue to the portal.
            </p>

            <Tabs
              value={role}
              onValueChange={(v) => setRole(v as Role)}
              className="mt-6"
            >
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="business">Business</TabsTrigger>
                <TabsTrigger value="admin">Admin</TabsTrigger>
                <TabsTrigger value="gatc">LMO/GATC</TabsTrigger>
              </TabsList>

              {(["business", "admin", "gatc"] as Role[]).map((r) => (
                <TabsContent key={r} value={r} className="mt-6">
                  <form onSubmit={handleSendOtp} className="flex flex-col gap-4">
                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor={`phone-${r}`}>Registered Mobile Number</Label>
                      <Input
                        id={`phone-${r}`}
                        type="tel"
                        inputMode="numeric"
                        maxLength={10}
                        placeholder={ROLE_PLACEHOLDER[r]}
                        value={phone}
                        onChange={(e) =>
                          setPhone(e.target.value.replace(/\D/g, ""))
                        }
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor={`pass-${r}`}>Password</Label>
                      <Input id={`pass-${r}`} type="password" placeholder="••••••••" />
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <label className="flex items-center gap-2 text-muted-foreground">
                        <input type="checkbox" className="h-3.5 w-3.5 rounded border-border" />
                        Remember me
                      </label>
                      <button
                        type="button"
                        className="font-medium text-primary hover:underline"
                      >
                        Forgot password?
                      </button>
                    </div>
                    <Button
                      type="submit"
                      className="mt-1 w-full bg-saffron text-saffron-foreground hover:bg-saffron/90"
                    >
                      Send OTP &amp; Continue
                    </Button>
                  </form>
                </TabsContent>
              ))}
            </Tabs>

            <p className="mt-8 text-center text-xs text-muted-foreground">
              New business user?{" "}
              <button className="font-medium text-primary hover:underline">
                Register your organisation
              </button>
            </p>
            <p className="mt-6 text-center text-[11px] text-muted-foreground">
              © Government of India · Department of Consumer Affairs · Ministry
              of Consumer Affairs, Food &amp; Public Distribution
            </p>
          </div>
        </div>
      </div>

      <OtpModal
        open={otpOpen}
        onOpenChange={setOtpOpen}
        phone={phone ? `+91 ${phone}` : "your registered number"}
        onVerified={handleVerified}
      />
    </div>
  );
}

function Feature({
  icon: Icon,
  title,
  desc,
}: {
  icon: typeof Gauge;
  title: string;
  desc: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/10">
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <p className="text-sm font-semibold text-white">{title}</p>
        <p className="text-xs leading-relaxed text-white/65">{desc}</p>
      </div>
    </div>
  );
}
