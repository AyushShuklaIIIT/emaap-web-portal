export function SuccessPopup({
  show,
  onClose,
}: {
  show: boolean;
  onClose: () => void;
}) {
  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="animate-[successPopup_0.35s_ease-out] rounded-2xl bg-white px-10 py-8 text-center shadow-2xl">
        {/* Green check */}
        <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-500">
            <svg
              className="h-8 w-8 text-white animate-[checkDraw_0.5s_ease-out_0.2s_both]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="3"
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
        </div>

        <h2 className="text-2xl font-bold text-[#1A1A2E]">
          Application Submitted
        </h2>

        <p className="mt-2 text-sm text-gray-500">
          Your verification application has been submitted successfully.
        </p>

        <button
          onClick={onClose}
          className="mt-6 rounded-lg bg-[#0B3D91] px-6 py-2.5 font-semibold text-white transition-all duration-200 hover:scale-105 hover:bg-[#082b66]"
        >
          Continue
        </button>
      </div>
    </div>
  );
}
