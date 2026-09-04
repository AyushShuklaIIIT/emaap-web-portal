import { DashboardLayout } from "@/components/emaap/DashboardLayout";
import { PlaceholderScreen } from "@/components/emaap/PlaceholderScreen";

export default function Gatc() {
  return (
    <DashboardLayout role="admin">
      <PlaceholderScreen
        title="GATC & Revenue Management"
        description="The table of authorised private testing centres, their categories, certificate validity and 80:20 revenue-share calculations will appear here."
      />
    </DashboardLayout>
  );
}
