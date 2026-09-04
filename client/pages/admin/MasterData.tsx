import { DashboardLayout } from "@/components/emaap/DashboardLayout";
import { PlaceholderScreen } from "@/components/emaap/PlaceholderScreen";

export default function MasterData() {
  return (
    <DashboardLayout role="admin">
      <PlaceholderScreen
        title="Master Data"
        description="System-wide reference data management (instrument categories, states, fee schedules) will appear here."
      />
    </DashboardLayout>
  );
}
