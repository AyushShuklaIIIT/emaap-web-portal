import { CheckCircle2 } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/emaap/DashboardLayout";
import { Button } from "@/components/ui/button";

interface SubmissionState {
  applicationId?: string;
}

export default function ApplicationSubmitted() {
  const navigate = useNavigate();
  const location = useLocation();
  const applicationId = (location.state as SubmissionState | null)?.applicationId;

  return (
    <DashboardLayout role="business">
      <section className="mx-auto max-w-2xl rounded-xl border border-[#E0E0E0] bg-white p-8 text-center shadow-card sm:p-12">
        <div className="mb-6 flex justify-center">
          <div className="rounded-full bg-green-50 p-4 text-green-600">
            <CheckCircle2 className="h-12 w-12" aria-hidden="true" />
          </div>
        </div>
        <h1 className="text-3xl font-bold text-[#1A1A2E]">Application submitted</h1>
        <p className="mt-3 text-[#5C5C70]">
          Your verification application has been submitted successfully. You can track its progress from your dashboard.
        </p>
        {applicationId && (
          <div className="mx-auto mt-6 max-w-md rounded-lg bg-[#F5F7FA] p-4">
            <p className="text-xs font-bold uppercase text-[#5C5C70]">Application ID</p>
            <p className="mt-1 break-all font-mono text-sm font-semibold text-[#0B3D91]">{applicationId}</p>
          </div>
        )}
        <Button className="mt-8 bg-[#0B3D91] hover:bg-[#082b66]" onClick={() => navigate("/business/new-application")}>
          Start a new application
        </Button>
      </section>
    </DashboardLayout>
  );
}
