import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { backendUrl } from "@/lib/backend-url";
import {
  CheckCircle2,
  FileDown,
  LoaderCircle,
  AlertTriangle,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface Certificate {
  certificateId: string;
  instrumentCategory: string | null;
  instrumentSerialNumber: string;
  issueDate: string;
  hash: string;
  sealImageUrls: string[];
  status: string;
  tokenHash?: string | null;
}

export const CertificateContent = ({
  certificate,
  isPdf = false,
}: {
  certificate: Certificate;
  isPdf?: boolean;
}) => {
  const isRejected = certificate.status === "FAILED_CHECKLIST";
  const mainImageSrc =
    certificate.sealImageUrls && certificate.sealImageUrls.length > 0
      ? certificate.sealImageUrls[0]
      : "";

  return (
    <div
      className={`bg-white ${isPdf ? "w-200 p-16" : "rounded-xl border border-gray-200 shadow-sm p-8 sm:p-12"}`}
    >
      {/* Header */}
      <div className="text-center mb-10 border-b pb-8">
        <div className="flex justify-center mb-4">
          {isRejected ? (
            <XCircle className="h-16 w-16 text-red-600" />
          ) : (
            <CheckCircle2 className="h-16 w-16 text-green-600" />
          )}
        </div>
        <h1
          className={`text-3xl font-bold mb-2 ${isRejected ? "text-red-700" : "text-gray-900"}`}
        >
          {isRejected
            ? "REJECTED - INSPECTION FAILED"
            : "VERIFIED LEGAL METROLOGY"}
        </h1>
        <p className="text-gray-500 font-medium tracking-widest uppercase text-sm">
          {isRejected
            ? "Action Required: Rectify within 7 days"
            : "Official Verification Certificate"}
        </p>
      </div>

      {/* Details Grid */}
      <div
        className={`grid ${isPdf ? "grid-cols-2" : "grid-cols-1 md:grid-cols-2"} gap-6 mb-10`}
      >
        <div>
          <p className="text-sm text-gray-500 font-medium mb-1">
            Instrument Category
          </p>
          <p className="text-gray-900 font-semibold text-lg">
            {certificate.instrumentCategory || "N/A"}
          </p>
        </div>
        <div>
          <p className="text-sm text-gray-500 font-medium mb-1">
            Serial Number
          </p>
          <p className="text-gray-900 font-semibold text-lg">
            {certificate.instrumentSerialNumber}
          </p>
        </div>
        <div className={isPdf ? "col-span-2" : "md:col-span-2"}>
          <p className="text-sm text-gray-500 font-medium mb-1">
            Certificate ID
          </p>
          <p className="text-gray-900 font-mono text-sm break-all">
            {certificate.certificateId}
          </p>
        </div>
        <div className={isPdf ? "col-span-2" : "md:col-span-2"}>
          <p className="text-sm text-gray-500 font-medium mb-1">Issue Date</p>
          <p className="text-gray-900 font-semibold">
            {new Date(certificate.issueDate).toLocaleString()}
          </p>
        </div>
      </div>

      {/* Hash Box */}
      <div className="bg-gray-50 rounded-lg p-5 mb-10 border border-gray-100">
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
          Cryptographic Hash
        </p>
        <p className="font-mono text-sm text-gray-800 break-all bg-white p-3 rounded border border-gray-200">
          {certificate.hash}
        </p>

        {certificate.tokenHash && (
          <div className="mt-4">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
              Digital Signature (Token Hash)
            </p>
            <p className="font-mono text-sm text-gray-800 break-all bg-white p-3 rounded border border-gray-200">
              {certificate.tokenHash}
            </p>
          </div>
        )}
      </div>

      {/* Live Evidence — only rendered when images exist */}
      {certificate.sealImageUrls && certificate.sealImageUrls.length > 0 && (
        <div>
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
            Live Physical Evidence
          </h3>
          <div className="rounded-lg overflow-hidden border-2 border-gray-200 bg-gray-50 p-2">
            <img
              src={
                mainImageSrc.startsWith("http://")
                  ? mainImageSrc.replace("http://", "https://")
                  : mainImageSrc
              }
              alt="Tamper Seal Evidence"
              crossOrigin="anonymous"
              className="w-full max-h-100 object-contain rounded"
            />
          </div>
        </div>
      )}

      <div className="mt-12 pt-6 border-t text-center">
        <p className="text-xs text-gray-400">
          This is a cryptographically secured verification record. Any
          modification invalidates this certificate.
        </p>
      </div>
    </div>
  );
};

export default function VerifyCertificate() {
  const { certificateId } = useParams<{ certificateId: string }>();
  const [searchParams] = useSearchParams();
  const signature = searchParams.get("sig");

  const [loading, setLoading] = useState(true);
  const [certificate, setCertificate] = useState<Certificate | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!certificateId || !signature) {
      setError("Missing certificate ID or signature.");
      setLoading(false);
      return;
    }

    const fetchCertificate = async () => {
      try {
        const response = await fetch(
          `${backendUrl}/api/verify/${certificateId}?sig=${encodeURIComponent(signature)}`,
        );

        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.error || "Failed to verify certificate");
        }

        const data = await response.json();
        // Fallback for old records that had sealImageUrl instead of sealImageUrls array
        const certData = data.certificate;
        if (!certData.sealImageUrls && certData.sealImageUrl) {
          certData.sealImageUrls = [certData.sealImageUrl];
        } else if (!certData.sealImageUrls) {
          certData.sealImageUrls = [];
        }

        setCertificate(certData);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Verification failed");
      } finally {
        setLoading(false);
      }
    };

    fetchCertificate();
  }, [certificateId, signature]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <LoaderCircle className="h-8 w-8 animate-spin text-[#0B3D91]" />
          <p className="text-sm text-gray-600">Verifying Certificate...</p>
        </div>
      </div>
    );
  }

  if (error || !certificate) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
        <div className="rounded-xl border border-red-200 bg-white p-8 text-center shadow-sm max-w-md w-full">
          <AlertTriangle className="mx-auto h-12 w-12 text-red-500 mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Verification Failed
          </h2>
          <p className="text-sm text-gray-600">
            {error || "Certificate not found."}
          </p>
        </div>
      </div>
    );
  }

  const isRejected = certificate.status === "FAILED_CHECKLIST";

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Actions - Only allow download if approved */}
        {!isRejected && (
          <div className="flex justify-end">
            <Button
              onClick={() => {
                window.open(
                  `${backendUrl}/api/certificates/${certificate.certificateId}/download`,
                  "_blank",
                );
              }}
              className="bg-[#0B3D91] hover:bg-[#082b66]"
            >
              <FileDown className="mr-2 h-4 w-4" />
              Download Server-Signed PDF
            </Button>
          </div>
        )}

        {/* Visible Certificate Container for the Screen */}
        <CertificateContent certificate={certificate} isPdf={false} />
      </div>
    </div>
  );
}
