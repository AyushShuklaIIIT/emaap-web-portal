import { QRCodeCanvas } from "qrcode.react";
import { DashboardLayout } from "@/components/emaap/DashboardLayout";
import { useCertificates } from "@/hooks/useCertificates";

export default function QRCodes({ userId }: { userId: string }) {
  const { certificates, isLoading, isError } = useCertificates(userId);

  return (
    <DashboardLayout role="business">
      <section className="mx-auto max-w-7xl p-4 sm:p-8">
        <div className="mb-8">
          <h1 className="text-xl font-bold text-[#1A1A2E] sm:text-2xl">
            Saved QR Codes
          </h1>

          <p className="mt-1 text-sm text-[#5C5C70]">
            All generated verification certificates.
          </p>
        </div>

        {isLoading ? (
          <div className="py-12 text-center text-gray-500">
            Loading QR codes...
          </div>
        ) : isError ? (
          <div className="rounded-xl border border-red-200 bg-white p-12 text-center">
            <p className="font-semibold text-red-600">
              Failed to load QR codes.
            </p>
          </div>
        ) : certificates.length === 0 ? (
          <div className="rounded-xl border border-[#E0E0E0] bg-white p-12 text-center">
            <p className="font-semibold text-[#1A1A2E]">
              No QR codes generated yet.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {certificates.map((certificate) => (
              <div
                key={certificate.cert_id}
                className="rounded-xl border border-[#E0E0E0] bg-white p-6 shadow-sm"
              >
                <div className="flex justify-center">
                  <QRCodeCanvas
                    value={certificate.dynamic_qr_url}
                    size={180}
                    level="H"
                    marginSize={4}
                  />
                </div>

                <div className="mt-6 space-y-2">
                  <p className="text-sm">
                    <span className="font-semibold">Certificate ID:</span>{" "}
                    {certificate.certificate_no}
                  </p>

                  <p className="text-sm">
                    <span className="font-semibold">Instrument:</span>{" "}
                    {certificate.instrument.category.category_name}
                  </p>

                  <p className="text-sm">
                    <span className="font-semibold">Serial Number:</span>{" "}
                    {certificate.instrument.serial_number}
                  </p>

                  <p className="text-sm text-gray-500">
                    Issued:{" "}
                    {new Date(certificate.issue_date).toLocaleString("en-IN")}
                  </p>

                  <p className="text-sm text-gray-500">
                    Expires:{" "}
                    {new Date(certificate.expiry_date).toLocaleDateString(
                      "en-IN",
                    )}
                  </p>
                </div>

                <a
                  href={certificate.dynamic_qr_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-5 block rounded-lg bg-[#0B3D91] px-4 py-2.5 text-center text-sm font-semibold text-white transition hover:bg-[#082b66]"
                >
                  Open Verification
                </a>
              </div>
            ))}
          </div>
        )}
      </section>
    </DashboardLayout>
  );
}
