import { DashboardLayout } from "@/components/emaap/DashboardLayout";
import { AdminApprovalPanel } from "@/components/admin/AdminApprovalPanel";

export default function Registrations() {
  return (
    <DashboardLayout role="admin">
      <AdminApprovalPanel />
    </DashboardLayout>
  );
}
