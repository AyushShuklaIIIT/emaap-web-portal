import { DashboardLayout } from "@/components/emaap/DashboardLayout";
import { PlaceholderScreen } from "@/components/emaap/PlaceholderScreen";

export default function Pendency() {
  return (
    <DashboardLayout role="admin">
      <PlaceholderScreen
        title="Application Pendency & Workflow"
        description="The incoming application queue and the algorithmic scheduling engine suggesting the nearest LMO/GATC will appear here."
      />
    </DashboardLayout>
  );
}
