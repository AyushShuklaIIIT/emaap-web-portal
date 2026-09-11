import { useEffect, useState } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { DashboardLayout } from "@/components/emaap/DashboardLayout";

const backendUrl = (import.meta.env.VITE_BACKEND_URL ?? "http://localhost:8008").replace(
  /\/$/,
  "",
);

interface Certificate {
  certificateId: string;
  instrumentCategory?: string;
  instrumentSerialNumber?: string;
  issueDate?: string;
  hash?: string;
}

export default function QRCodes() {
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCertificates = async () => {
      try {
        const response = await fetch(`${backendUrl}/api/certificates`);

        if (!response.ok) {
          throw new Error("Failed to fetch certificates");
        }

        const data = await response.json();
        setCertificates(data);
      } catch (error) {
        console.error("Failed to load certificates:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCertificates();
  }, []);

  return (
    <DashboardLayout role="business">
      <section className="mx-auto max-w-7xl p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-[#1A1A2E]">Saved QR Codes</h1>

          <p className="mt-1 text-sm text-[#5C5C70]">
            All generated verification certificates.
          </p>
        </div>

        {loading ? (
          <div className="py-12 text-center text-gray-500">
            Loading QR codes...
          </div>
        ) : certificates.length === 0 ? (
          <div className="rounded-xl border border-[#E0E0E0] bg-white p-12 text-center">
            <p className="font-semibold text-[#1A1A2E]">
              No QR codes generated yet.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {certificates.map((certificate) => {
              const verificationUrl = `${backendUrl}/verify/${certificate.certificateId}`;

              return (
                <div
                  key={certificate.certificateId}
                  className="rounded-xl border border-[#E0E0E0] bg-white p-6 shadow-sm"
                >
                  <div className="flex justify-center">
                    <QRCodeCanvas
                      value={verificationUrl}
                      size={180}
                      level="H"
                      marginSize={4}
                    />
                  </div>

                  <div className="mt-6 space-y-2">
                    <p className="text-sm">
                      <span className="font-semibold">Certificate ID:</span>{" "}
                      {certificate.certificateId}
                    </p>

                    <p className="text-sm">
                      <span className="font-semibold">Instrument:</span>{" "}
                      {certificate.instrumentCategory ?? "N/A"}
                    </p>

                    <p className="text-sm">
                      <span className="font-semibold">Serial Number:</span>{" "}
                      {certificate.instrumentSerialNumber ?? "N/A"}
                    </p>

                    <p className="text-sm text-gray-500">
                      {certificate.issueDate
                        ? new Date(certificate.issueDate).toLocaleString()
                        : ""}
                    </p>
                  </div>

                  <a
                    href={verificationUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-5 block rounded-lg bg-[#0B3D91] px-4 py-2.5 text-center text-sm font-semibold text-white transition hover:bg-[#082b66]"
                  >
                    Open Verification
                  </a>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </DashboardLayout>
  );
}
