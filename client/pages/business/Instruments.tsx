import { DashboardLayout } from "@/components/emaap/DashboardLayout";
import { PlaceholderScreen } from "@/components/emaap/PlaceholderScreen";

export default function Instruments() {
  return (
    <DashboardLayout role="business">
      <PlaceholderScreen
        title="Instrument & Certificate Repository"
        description="A searchable, paginated table of every verified instrument across India with expiry status and downloadable digital certificates will appear here."
      />
    </DashboardLayout>
  );
}
