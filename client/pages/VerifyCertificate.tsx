import { useEffect, useState, useRef } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { backendUrl } from "@/lib/backend-url";
import { CheckCircle2, FileDown, LoaderCircle, AlertTriangle } from "lucide-react";
import { toPng } from "html-to-image";
import jsPDF from "jspdf";
import { Button } from "@/components/ui/button";

interface Certificate {
  certificateId: string;
  instrumentCategory: string | null;
  instrumentSerialNumber: string;
  issueDate: string;
  hash: string;
  sealImageUrl: string;
}

// Helper component to render the certificate body
// We use this to render both the responsive screen version and the fixed-width PDF version
const CertificateContent = ({ certificate, imageSrc, isPdf = false }: { certificate: Certificate, imageSrc: string, isPdf?: boolean }) => (
  <div className={`bg-white ${isPdf ? 'w-[800px] p-16' : 'rounded-xl border border-gray-200 shadow-sm p-8 sm:p-12 print:border-none print:shadow-none print:p-0'}`}>
    {/* Header */}
    <div className="text-center mb-10 border-b pb-8">
      <div className="flex justify-center mb-4">
        <CheckCircle2 className="h-16 w-16 text-green-600" />
      </div>
      <h1 className="text-3xl font-bold text-gray-900 mb-2">VERIFIED LEGAL METROLOGY</h1>
      <p className="text-gray-500 font-medium tracking-widest uppercase text-sm">Official Verification Certificate</p>
    </div>

    {/* Details Grid */}
    <div className={`grid ${isPdf ? 'grid-cols-2' : 'grid-cols-1 md:grid-cols-2'} gap-6 mb-10`}>
      <div>
        <p className="text-sm text-gray-500 font-medium mb-1">Instrument Category</p>
        <p className="text-gray-900 font-semibold text-lg">{certificate.instrumentCategory || "N/A"}</p>
      </div>
      <div>
        <p className="text-sm text-gray-500 font-medium mb-1">Serial Number</p>
        <p className="text-gray-900 font-semibold text-lg">{certificate.instrumentSerialNumber}</p>
      </div>
      <div className={isPdf ? 'col-span-2' : 'md:col-span-2'}>
        <p className="text-sm text-gray-500 font-medium mb-1">Certificate ID</p>
        <p className="text-gray-900 font-mono text-sm break-all">{certificate.certificateId}</p>
      </div>
      <div className={isPdf ? 'col-span-2' : 'md:col-span-2'}>
        <p className="text-sm text-gray-500 font-medium mb-1">Issue Date</p>
        <p className="text-gray-900 font-semibold">{new Date(certificate.issueDate).toLocaleString()}</p>
      </div>
    </div>

    {/* Hash Box */}
    <div className="bg-gray-50 rounded-lg p-5 mb-10 border border-gray-100">
      <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Cryptographic Hash</p>
      <p className="font-mono text-sm text-gray-800 break-all bg-white p-3 rounded border border-gray-200">
        {certificate.hash}
      </p>
    </div>

    {/* Live Seal Evidence */}
    <div>
      <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
        <span className="w-8 h-8 rounded bg-[#0B3D91]/10 text-[#0B3D91] flex items-center justify-center mr-3 text-sm">📸</span>
        Live Physical Seal Evidence
      </h3>
      {imageSrc ? (
        <div className="rounded-lg overflow-hidden border-2 border-gray-200 bg-gray-50 p-2">
          <img 
            src={imageSrc} 
            alt="Tamper Seal Evidence" 
            crossOrigin="anonymous"
            className="w-full max-h-[400px] object-contain rounded"
          />
        </div>
      ) : (
        <div className="h-48 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center bg-gray-50 text-gray-400 text-sm">
          No seal image available
        </div>
      )}
    </div>
    
    <div className="mt-12 pt-6 border-t text-center">
      <p className="text-xs text-gray-400">
        This is a cryptographically secured verification record. Any modification invalidates this certificate.
      </p>
    </div>
  </div>
);

export default function VerifyCertificate() {
  const { certificateId } = useParams<{ certificateId: string }>();
  const [searchParams] = useSearchParams();
  const signature = searchParams.get("sig");

  const [loading, setLoading] = useState(true);
  const [certificate, setCertificate] = useState<Certificate | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);
  const pdfCertRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!certificateId || !signature) {
      setError("Missing certificate ID or signature.");
      setLoading(false);
      return;
    }

    const fetchCertificate = async () => {
      try {
        const response = await fetch(`${backendUrl}/api/verify/${certificateId}?sig=${encodeURIComponent(signature)}`);
        
        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.error || "Failed to verify certificate");
        }

        const data = await response.json();
        setCertificate(data.certificate);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Verification failed");
      } finally {
        setLoading(false);
      }
    };

    fetchCertificate();
  }, [certificateId, signature]);

  const handleDownloadPdf = async () => {
    if (!pdfCertRef.current || !certificate) return;
    setDownloading(true);

    try {
      const element = pdfCertRef.current;
      
      const dataUrl = await toPng(element, { 
        cacheBust: true, 
        pixelRatio: 2,
        backgroundColor: '#ffffff'
      });

      const { clientWidth, clientHeight } = element;
      
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (clientHeight * pdfWidth) / clientWidth;

      pdf.addImage(dataUrl, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Certificate-${certificate.certificateId.substring(0, 8)}.pdf`);
    } catch (err) {
      console.error("Failed to generate PDF", err);
    } finally {
      setDownloading(false);
    }
  };

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
          <h2 className="text-xl font-bold text-gray-900 mb-2">Verification Failed</h2>
          <p className="text-sm text-gray-600">{error || "Certificate not found."}</p>
        </div>
      </div>
    );
  }

  // Ensure Cloudinary images have a valid URL protocol for rendering
  let imageSrc = certificate.sealImageUrl || "";
  if (imageSrc.startsWith("http://")) {
    imageSrc = imageSrc.replace("http://", "https://");
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 print:bg-white print:py-0 relative overflow-hidden">
      
      {/* Hidden fixed-width template dedicated strictly for perfect A4 PDF generation */}
      <div className="absolute left-[-9999px] top-[-9999px]">
        <div ref={pdfCertRef}>
          <CertificateContent certificate={certificate} imageSrc={imageSrc} isPdf={true} />
        </div>
      </div>

      <div className="max-w-2xl mx-auto space-y-6">
        {/* Actions - Hidden when printing */}
        <div className="flex justify-end print:hidden">
          <Button 
            onClick={handleDownloadPdf} 
            disabled={downloading}
            className="bg-[#0B3D91] hover:bg-[#082b66]"
          >
            {downloading ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <FileDown className="mr-2 h-4 w-4" />}
            {downloading ? "Generating PDF..." : "Download PDF Certificate"}
          </Button>
        </div>

        {/* Visible Certificate Container for the Screen */}
        <CertificateContent certificate={certificate} imageSrc={imageSrc} isPdf={false} />
      </div>
    </div>
  );
}
