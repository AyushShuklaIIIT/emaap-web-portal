import { useEffect, useState } from "react";
import {
  Cloud,
  CloudDownload,
  FileText,
  Loader2,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { useGatewayApi } from "@/contexts/GatewayApiContext";

export interface DigilockerDoc {
  uri: string;
  name: string;
  type: string;
  date: string;
}

interface DigilockerVaultDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImportSuccess: (importedDocs: DigilockerDoc[]) => void;
}

export function DigilockerVaultDrawer({
  open,
  onOpenChange,
  onImportSuccess,
}: DigilockerVaultDrawerProps) {
  const { request } = useGatewayApi();
  const [isConnected, setIsConnected] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [availableDocuments, setAvailableDocuments] = useState<DigilockerDoc[]>(
    [],
  );
  const [selectedDocs, setSelectedDocs] = useState<string[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState<string>();

  // Reset state when drawer closes
  useEffect(() => {
    if (!open) {
      setTimeout(() => {
        setIsConnected(false);
        setAvailableDocuments([]);
        setSelectedDocs([]);
        setError(undefined);
      }, 300);
    }
  }, [open]);

  // OAuth Popup Message Listener
  useEffect(() => {
    const handleMessage = async (event: MessageEvent) => {
      if (event.data?.type === "DIGILOCKER_AUTH_CODE" && event.data?.code) {
        try {
          const result = await request<{ documents: DigilockerDoc[] }>({
            endpoint: "/api/v1/gateway/digilocker/fetch-documents",
            method: "POST",
            data: { authCode: event.data.code },
          });
          setIsConnected(true);
          setAvailableDocuments(result.documents);
        } catch (err: any) {
          setError(err.message || "Failed to fetch documents from DigiLocker");
        } finally {
          setAuthLoading(false);
        }
      } else if (event.data?.type === "DIGILOCKER_AUTH_ERROR") {
        setError(event.data.error || "Authentication cancelled or failed");
        setAuthLoading(false);
      }
    };

    if (authLoading) {
      window.addEventListener("message", handleMessage);
    }
    return () => window.removeEventListener("message", handleMessage);
  }, [authLoading, request]);

  const handleConnect = async () => {
    setAuthLoading(true);
    setError(undefined);

    // Mock Mode Fallback
    if (import.meta.env.VITE_MOCK_MODE === "true") {
      setTimeout(() => {
        setAuthLoading(false);
        setIsConnected(true);
        setAvailableDocuments([
          {
            uri: "in.gov.uidai-aadhaar-123",
            name: "Aadhaar Card",
            type: "AADHAAR",
            date: "2023-01-15",
          },
          {
            uri: "in.gov.incometax-pan-456",
            name: "PAN Verification Record",
            type: "PAN",
            date: "2022-11-20",
          },
          {
            uri: "in.gov.mca-incorporation-789",
            name: "Certificate of Incorporation",
            type: "CIN",
            date: "2020-05-10",
          },
        ]);
      }, 1500);
      return;
    }

    try {
      const { authUrl } = await request<{ authUrl: string }>({
        endpoint: "/api/v1/gateway/digilocker/auth-url",
        method: "GET",
      });

      const popup = window.open(
        authUrl,
        "DigilockerAuth",
        "width=500,height=700,status=yes,scrollbars=yes",
      );
      if (!popup) {
        throw new Error(
          "Popup blocked. Please allow popups to connect DigiLocker.",
        );
      }
    } catch (err: any) {
      setAuthLoading(false);
      setError(err.message || "Failed to fetch authentication URL.");
    }
  };

  const toggleSelection = (uri: string) => {
    setSelectedDocs((prev) =>
      prev.includes(uri) ? prev.filter((id) => id !== uri) : [...prev, uri],
    );
  };

  const handleImport = async () => {
    if (selectedDocs.length === 0) return;
    setIsSyncing(true);
    setError(undefined);

    // Mock Mode Fallback
    if (import.meta.env.VITE_MOCK_MODE === "true") {
      setTimeout(() => {
        setIsSyncing(false);
        const imported = availableDocuments.filter((d) =>
          selectedDocs.includes(d.uri),
        );
        onImportSuccess(imported);
        onOpenChange(false);
      }, 2000);
      return;
    }

    try {
      await request({
        endpoint: "/api/v1/gateway/digilocker/import",
        method: "POST",
        data: { docUris: selectedDocs },
      });

      const imported = availableDocuments.filter((d) =>
        selectedDocs.includes(d.uri),
      );
      onImportSuccess(imported);
      onOpenChange(false);
    } catch (err: any) {
      setError(err.message || "Failed to import selected documents.");
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <Sheet
      open={open}
      onOpenChange={(val) => {
        if (!isSyncing && !authLoading) onOpenChange(val);
      }}
    >
      <SheetContent className="w-full sm:max-w-md flex flex-col gap-0 p-0">
        <div className="p-6 pb-4 border-b">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2 text-xl">
              <Cloud className="h-6 w-6 text-blue-600" />
              DigiLocker Vault
            </SheetTitle>
            <SheetDescription>
              Securely import your government-issued verified credentials
              directly from DigiLocker.
            </SheetDescription>
          </SheetHeader>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {!isConnected ? (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-6">
              <div className="h-20 w-20 rounded-full bg-blue-50 flex items-center justify-center">
                <ShieldCheck className="h-10 w-10 text-blue-600" />
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold text-lg">Connect your Account</h3>
                <p className="text-sm text-muted-foreground px-4">
                  Link your DigiLocker to seamlessly pull verified documents
                  like Aadhaar, PAN, and Incorporation certificates.
                </p>
              </div>

              {error && (
                <p className="text-sm text-destructive font-medium">{error}</p>
              )}

              <Button
                onClick={() => void handleConnect()}
                disabled={authLoading}
                className="w-full max-w-62.5 bg-blue-600 hover:bg-blue-700 text-white"
              >
                {authLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />{" "}
                    Connecting...
                  </>
                ) : (
                  "Connect DigiLocker"
                )}
              </Button>
            </div>
          ) : (
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-semibold text-foreground">
                  Available Documents
                </h4>
                <Badge
                  variant="outline"
                  className="bg-blue-50 text-blue-700 border-blue-200"
                >
                  {availableDocuments.length} Found
                </Badge>
              </div>

              {availableDocuments.length === 0 ? (
                <div className="text-center py-10">
                  <p className="text-sm text-muted-foreground">
                    No documents found in your DigiLocker.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {availableDocuments.map((doc) => (
                    <div
                      key={doc.uri}
                      className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${
                        selectedDocs.includes(doc.uri)
                          ? "border-blue-500 bg-blue-50/50"
                          : "hover:bg-muted/50"
                      }`}
                    >
                      <Checkbox
                        id={doc.uri}
                        checked={selectedDocs.includes(doc.uri)}
                        onCheckedChange={() => toggleSelection(doc.uri)}
                        className="mt-1 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                        aria-label={`Select ${doc.name}`}
                      />
                      <Label
                        htmlFor={doc.uri}
                        className="flex-1 cursor-pointer space-y-1 font-normal"
                      >
                        <div className="flex items-center justify-between">
                          <p className="font-medium text-foreground">
                            {doc.name}
                          </p>
                          <Badge
                            variant="secondary"
                            className="text-[10px] uppercase bg-green-100 text-green-800 hover:bg-green-100"
                          >
                            Verified
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <FileText className="h-3 w-3" />
                          <span>{doc.type}</span>
                          <span>&bull;</span>
                          <span>Issued: {doc.date}</span>
                        </div>
                      </Label>
                    </div>
                  ))}
                </div>
              )}
              {error && (
                <p className="text-sm text-destructive mt-4">{error}</p>
              )}
            </div>
          )}
        </div>

        {isConnected && (
          <div className="p-6 border-t bg-muted/20">
            <Button
              className="w-full"
              disabled={selectedDocs.length === 0 || isSyncing}
              onClick={() => void handleImport()}
            >
              {isSyncing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Importing...
                </>
              ) : (
                <>
                  <CloudDownload className="mr-2 h-4 w-4" /> Import{" "}
                  {selectedDocs.length} Document
                  {selectedDocs.length !== 1 && "s"}
                </>
              )}
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
