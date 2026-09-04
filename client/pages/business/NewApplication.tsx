import { DashboardLayout } from "@/components/emaap/DashboardLayout";
import { PlaceholderScreen } from "@/components/emaap/PlaceholderScreen";

export default function NewApplication() {
  return (
    <DashboardLayout role="business">
      <PlaceholderScreen
        title="New Verification Application"
        description="The multi-step wizard for instrument details, location & documents, and fee payment will appear here."
      />
    </DashboardLayout>
  );
}
