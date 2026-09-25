import { useEffect, useState } from "react";
import {
  CheckCircle2,
  FileSignature,
  Loader2,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useGatewayApi } from "@/contexts/GatewayApiContext";

type EsignStatus =
  "INITIATED" | "AWAITING_ESP" | "PROCESSING" | "COMPLETED" | "FAILED";

interface EsignSignerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  documentId: string;
  unsignedPdfUrl: string;
  signerAadhaarMasked: string;
  onSuccess?: (signedPdfUrl: string) => void;
}

interface InitiateResponse {
  aspTxnId: string;
  espRedirectUrl: string;
  xmlPayload: string;
}

interface StatusResponse {
  status: "PENDING" | "COMPLETED" | "FAILED";
  signedPdfUrl?: string;
  error?: string;
}

export function EsignSignerModal({
  open,
  onOpenChange,
  documentId,
  unsignedPdfUrl,
  signerAadhaarMasked,
  onSuccess,
}: EsignSignerModalProps) {
  const { request } = useGatewayApi();
  const [esignStatus, setEsignStatus] = useState<EsignStatus>("INITIATED");
  const [aspTxnId, setAspTxnId] = useState<string>();
  const [signedPdfUrl, setSignedPdfUrl] = useState<string>();
  const [consentGiven, setConsentGiven] = useState(false);
  const [error, setError] = useState<string>();

  // Reset state when modal opens/closes
  useEffect(() => {
    if (open) {
      setEsignStatus("INITIATED");
      setAspTxnId(undefined);
      setSignedPdfUrl(undefined);
      setConsentGiven(false);
      setError(undefined);
    }
  }, [open]);

  // Handle window message from ESP gateway popup callback
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (
        event.data?.type === "ESIGN_CALLBACK" &&
        event.data?.aspTxnId === aspTxnId
      ) {
        setEsignStatus("PROCESSING");
      }
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [aspTxnId]);

  // Polling for ESP Gateway Status
  useEffect(() => {
    let intervalId: number;
    const checkStatus = async () => {
      if (
        !aspTxnId ||
        esignStatus === "COMPLETED" ||
        esignStatus === "FAILED" ||
        esignStatus === "INITIATED"
      )
        return;
      try {
        const result = await request<StatusResponse>({
          endpoint: `/api/v1/gateway/esign/status/${aspTxnId}`,
          method: "GET",
        });

        if (result.status === "COMPLETED" && result.signedPdfUrl) {
          setSignedPdfUrl(result.signedPdfUrl);
          setEsignStatus("COMPLETED");
          onSuccess?.(result.signedPdfUrl);
        } else if (result.status === "FAILED") {
          setEsignStatus("FAILED");
          setError(result.error || "Aadhaar eSign transaction failed.");
        }
      } catch (err) {
        // Soft fail polling to avoid immediate crash on intermittent network issues
        console.warn("Polling error:", err);
      }
    };

    if (esignStatus === "AWAITING_ESP" || esignStatus === "PROCESSING") {
      intervalId = window.setInterval(checkStatus, 5000);
    }
    return () => {
      if (intervalId) window.clearInterval(intervalId);
    };
  }, [esignStatus, aspTxnId, request, onSuccess]);

  const handleInitiate = async () => {
    if (!consentGiven) return;
    setError(undefined);
    setEsignStatus("PROCESSING");

    // Mock Fallback Handler
    if (import.meta.env.VITE_MOCK_MODE === "true") {
      setTimeout(() => {
        const mockSignedUrl = `${unsignedPdfUrl}#mock-signed-true`;
        setSignedPdfUrl(mockSignedUrl);
        setEsignStatus("COMPLETED");
        onSuccess?.(mockSignedUrl);
      }, 3000);
      return;
    }

    try {
      const result = await request<InitiateResponse>({
        endpoint: "/api/v1/gateway/esign/initiate",
        method: "POST",
        data: { documentId, signerAadhaarMasked },
      });

      setAspTxnId(result.aspTxnId);
      setEsignStatus("AWAITING_ESP");

      const popup = window.open(
        "",
        "EsignPopup",
        "width=800,height=600,status=yes,scrollbars=yes",
      );
      if (popup) {
        popup.document.write(`
          <!DOCTYPE html>
          <html><head><title>Redirecting to CDAC/NSDL...</title></head><body>
            <p style="font-family: sans-serif; text-align: center; margin-top: 50px;">
              Redirecting to secure Aadhaar eSign Gateway...
            </p>
            <form id="esignForm" action="${result.espRedirectUrl}" method="POST">
              <input type="hidden" name="eSignRequest" value="${result.xmlPayload}" />
              <input type="hidden" name="aspTxnId" value="${result.aspTxnId}" />
            </form>
            <script>document.getElementById('esignForm').submit();</script>
          </body></html>
        `);
      } else {
        throw new Error(
          "Popup blocked. Please allow popups for this site to sign.",
        );
      }
    } catch (err: any) {
      setEsignStatus("FAILED");
      setError(err.message || "Failed to initiate eSign request.");
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(val) => {
        // Prevent closing when transaction is in-flight
        if (
          (esignStatus === "AWAITING_ESP" || esignStatus === "PROCESSING") &&
          !val
        )
          return;
        onOpenChange(val);
      }}
    >
      <DialogContent className="sm:max-w-4xl max-h-[90vh] flex flex-col p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSignature className="h-5 w-5 text-primary" />
            Aadhaar eSign Application
          </DialogTitle>
          <DialogDescription>
            Review the document and provide legal consent to cryptographically
            sign via CDAC/NSDL.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 flex flex-col md:flex-row gap-6 min-h-125 mt-4">
          <div className="flex-1 rounded-md border bg-muted overflow-hidden">
            <iframe
              src={
                esignStatus === "COMPLETED" && signedPdfUrl
                  ? signedPdfUrl
                  : unsignedPdfUrl
              }
              className="w-full h-full border-none"
              title="Document Preview"
              aria-label="PDF Document Preview"
            />
          </div>

          <div className="w-full md:w-[320px] flex flex-col gap-6 rounded-md border bg-card p-5 shadow-sm">
            {esignStatus === "INITIATED" && (
              <>
                <div className="flex flex-col gap-3 rounded-lg border border-primary/20 bg-primary/5 p-4 text-sm">
                  <div className="flex items-start gap-2">
                    <ShieldCheck className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <p className="leading-relaxed">
                      By proceeding, I authorize the eSign Application Service
                      Provider (ASP) to fetch and embed my Aadhaar-linked
                      cryptographic signature.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 space-y-0 pt-2">
                  <Checkbox
                    id="consent"
                    checked={consentGiven}
                    onCheckedChange={(checked) =>
                      setConsentGiven(checked === true)
                    }
                    aria-label="Aadhaar eSign Consent"
                  />
                  <Label
                    htmlFor="consent"
                    className="text-sm font-medium leading-tight cursor-pointer"
                  >
                    I agree to eSign this document using Aadhaar (ID:{" "}
                    {signerAadhaarMasked}).
                  </Label>
                </div>

                <Button
                  className="w-full mt-auto bg-[#e58a2d] hover:bg-[#d67b20] text-white"
                  disabled={!consentGiven}
                  onClick={() => void handleInitiate()}
                >
                  Sign with Aadhaar eSign
                </Button>
              </>
            )}

            {(esignStatus === "AWAITING_ESP" ||
              esignStatus === "PROCESSING") && (
              <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <div className="space-y-1">
                  <h3 className="font-semibold text-lg">
                    {esignStatus === "AWAITING_ESP"
                      ? "Awaiting Signature"
                      : "Processing Signature"}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {esignStatus === "AWAITING_ESP"
                      ? "Please complete the Aadhaar OTP verification in the secure NSDL popup window."
                      : "Verifying signature and generating PDF-A certificate..."}
                  </p>
                </div>
              </div>
            )}

            {esignStatus === "COMPLETED" && (
              <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
                <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircle2 className="h-8 w-8 text-green-600" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-semibold text-lg text-green-700">
                    Signature Applied
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    The document has been successfully cryptographically signed.
                  </p>
                </div>
                <Button
                  className="w-full mt-4"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                >
                  Close Viewer
                </Button>
              </div>
            )}

            {esignStatus === "FAILED" && (
              <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
                <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
                  <XCircle className="h-8 w-8 text-red-600" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-semibold text-lg text-red-700">
                    Verification Failed
                  </h3>
                  <p className="text-sm text-muted-foreground">{error}</p>
                </div>
                <Button
                  className="w-full mt-4"
                  onClick={() => setEsignStatus("INITIATED")}
                >
                  Try Again
                </Button>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
