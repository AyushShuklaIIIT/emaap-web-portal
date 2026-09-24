import { CheckCircle2 } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/emaap/DashboardLayout";
import { Button } from "@/components/ui/button";

interface SubmissionState {
  applicationId?: string;
  applicationType?: string;
  categoryName?: string;
  receiptNo?: string;
  totalAmount?: number;
}

const formatCurrency = (amount: number) =>
  amount.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

export default function ApplicationSubmitted() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as SubmissionState | null;

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

        {state && (
          <div className="mx-auto mt-8 max-w-lg rounded-lg border border-[#E0E0E0] bg-[#F5F7FA] p-6 text-left">
            {state.applicationId && (
              <div className="mb-4">
                <p className="text-xs font-bold uppercase text-[#5C5C70]">Application Number</p>
                <p className="mt-1 font-semibold text-[#1A1A2E] break-all">{state.applicationId}</p>
              </div>
            )}

            {state.applicationType && (
              <div className="mb-4">
                <p className="text-xs font-bold uppercase text-[#5C5C70]">Application Type</p>
                <p className="mt-1 font-semibold text-[#1A1A2E]">
                  {state.applicationType === "RE_VERIFICATION"
                    ? "Re-verification"
                    : "Initial Verification"}
                </p>
              </div>
            )}

            {state.categoryName && (
              <div className="mb-4">
                <p className="text-xs font-bold uppercase text-[#5C5C70]">Instrument Category</p>
                <p className="mt-1 font-semibold text-[#1A1A2E]">{state.categoryName}</p>
              </div>
            )}

            {state.receiptNo && (
              <div className="mb-4">
                <p className="text-xs font-bold uppercase text-[#5C5C70]">Receipt Number</p>
                <p className="mt-1 font-semibold text-[#1A1A2E]">{state.receiptNo}</p>
              </div>
            )}

            {state.totalAmount !== undefined && (
              <div>
                <p className="text-xs font-bold uppercase text-[#5C5C70]">Amount Paid</p>
                <p className="mt-1 text-xl font-bold text-[#1E8E3E]">
                  ₹{formatCurrency(state.totalAmount)}
                </p>
              </div>
            )}
          </div>
        )}

        <Button className="mt-8 bg-[#0B3D91] hover:bg-[#082b66]" onClick={() => navigate("/business/new-application")}>
          Start a new application
        </Button>
      </section>
    </DashboardLayout>
  );
}
