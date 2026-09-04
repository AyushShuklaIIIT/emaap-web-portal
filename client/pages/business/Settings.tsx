import { DashboardLayout } from "@/components/emaap/DashboardLayout";
import { PlaceholderScreen } from "@/components/emaap/PlaceholderScreen";

export default function BusinessSettings() {
  return (
    <DashboardLayout role="business">
      <PlaceholderScreen
        title="Settings & Profile"
        description="Account management, API integration keys for ERP connectivity, and system logs will appear here."
      />
    </DashboardLayout>
  );
}
