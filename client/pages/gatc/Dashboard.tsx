import { Link } from "react-router-dom";
import { TricolorBar } from "@/components/emaap/TricolorBar";
import { EmaapLogo } from "@/components/emaap/EmaapLogo";
import { PlaceholderScreen } from "@/components/emaap/PlaceholderScreen";

export default function GatcDashboard() {
  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <TricolorBar />
      <header className="flex h-16 shrink-0 items-center justify-between border-b border-border bg-card px-6">
        <EmaapLogo />
        <Link to="/" className="text-sm font-medium text-primary hover:underline">
          Sign out
        </Link>
      </header>
      <main className="flex-1 px-8 py-7">
        <PlaceholderScreen
          title="LMO / GATC Portal"
          description="Field inspection assignments, geo-tagged verification uploads and certificate issuance tools for licensed metrology officers and authorised test centres will appear here."
        />
      </main>
    </div>
  );
}
