import { DashboardLayout } from "@/components/emaap/DashboardLayout";
import { PlaceholderScreen } from "@/components/emaap/PlaceholderScreen";

export default function AdminDashboard() {
  return (
    <DashboardLayout role="admin">
      <PlaceholderScreen
        title="Admin Master Dashboard"
        description="Pan-India compliance KPIs, revenue collected, active GATCs, state-wise pendency bar chart and verification trend line graph will appear here."
      />
    </DashboardLayout>
  );
}
