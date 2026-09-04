import { DashboardLayout } from "@/components/emaap/DashboardLayout";
import { PlaceholderScreen } from "@/components/emaap/PlaceholderScreen";

export default function Helpdesk() {
  return (
    <DashboardLayout role="business">
      <PlaceholderScreen
        title="Helpdesk"
        description="Support tickets, FAQs and contact options for eMaap business users will appear here."
      />
    </DashboardLayout>
  );
}
