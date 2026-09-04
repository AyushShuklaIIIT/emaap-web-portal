import { DashboardLayout } from "@/components/emaap/DashboardLayout";
import { PlaceholderScreen } from "@/components/emaap/PlaceholderScreen";

export default function AdminSettings() {
  return (
    <DashboardLayout role="admin">
      <PlaceholderScreen
        title="Settings & Profile"
        description="Account management, access control and system logs for administrators will appear here."
      />
    </DashboardLayout>
  );
}
