import { DashboardLayout } from "@/components/emaap/DashboardLayout";
import { PlaceholderScreen } from "@/components/emaap/PlaceholderScreen";

export default function Revenue() {
  return (
    <DashboardLayout role="admin">
      <PlaceholderScreen
        title="Revenue Reports"
        description="Detailed revenue analytics and enforcement/audit trail lookups will appear here."
      />
    </DashboardLayout>
  );
}
