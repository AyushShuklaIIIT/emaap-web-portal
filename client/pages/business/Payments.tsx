import { DashboardLayout } from "@/components/emaap/DashboardLayout";
import { PlaceholderScreen } from "@/components/emaap/PlaceholderScreen";

export default function Payments() {
  return (
    <DashboardLayout role="business">
      <PlaceholderScreen
        title="Payments"
        description="Verification fee summaries, payment gateway options (UPI, Net Banking, NEFT/RTGS) and receipt history will appear here."
      />
    </DashboardLayout>
  );
}
