import { useEffect, useState } from "react";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { AlertCircle, ArrowRight, Building2, CheckCircle2, Loader2, ShieldCheck } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useGatewayApi } from "@/contexts/GatewayApiContext";

interface NswsProfile {
  businessName: string;
  panNumber: string;
  dpiitId?: string;
  email: string;
  status: string;
}

export function NswsSsoHandler() {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { request } = useGatewayApi();

  const [isProcessingToken, setIsProcessingToken] = useState(true);
  const [nswsProfile, setNswsProfile] = useState<NswsProfile | null>(null);
  const [error, setError] = useState<string>();

  useEffect(() => {
    const token = searchParams.get("token");

    // Clear the sensitive token from the URL and browser history immediately
    if (token) {
      window.history.replaceState({}, document.title, location.pathname);
      void consumeToken(token);
    } else if (!nswsProfile && !error) {
      setIsProcessingToken(false);
      setError("No SSO token found in the request. Please initiate login from the NSWS Portal.");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const consumeToken = async (token: string) => {
    try {
      if (import.meta.env.VITE_MOCK_MODE === "true") {
        setTimeout(() => {
          setNswsProfile({
            businessName: "Acme Manufacturing Limited",
            panNumber: "XXXXX1234X",
            email: "compliance@acmeproduction.test",
            dpiitId: "DPIIT-987654",
            status: "VERIFIED",
          });
          setIsProcessingToken(false);
        }, 2000);
        return;
      }

      const profile = await request<NswsProfile>({
        endpoint: "/api/v1/gateway/nsws/consume-token",
        method: "POST",
        data: { token },
      });

      setNswsProfile(profile);
    } catch (err: any) {
      setError(err.message || "Failed to authenticate NSWS session. The token may be expired or invalid.");
    } finally {
      setIsProcessingToken(false);
    }
  };

  const handleContinue = () => {
    navigate("/dashboard/applications", { replace: true });
  };

  if (isProcessingToken) {
    return (
      <div className="flex h-[80vh] flex-col items-center justify-center gap-6">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <div className="space-y-2 text-center">
          <h2 className="text-2xl font-semibold tracking-tight">Authenticating via NSWS</h2>
          <p className="text-muted-foreground">
            Please wait while we securely exchange your Single Window credentials...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-[80vh] items-center justify-center p-4">
        <Alert variant="destructive" className="max-w-lg">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Authentication Failed</AlertTitle>
          <AlertDescription className="mt-2 space-y-4">
            <p>{error}</p>
            <Button variant="outline" onClick={() => navigate("/login", { replace: true })}>
              Return to Login
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto flex max-w-2xl flex-col items-center justify-center py-12">
      <div className="mb-8 w-full text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
          <ShieldCheck className="h-8 w-8 text-green-600" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Welcome to Legal Metrology</h1>
        <p className="mt-2 text-muted-foreground">
          Your NSWS profile has been successfully synchronized.
        </p>
      </div>

      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-muted-foreground" />
            Applicant Profile Review
          </CardTitle>
          <CardDescription>
            The following details have been securely imported from the National Single Window System.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1">
              <span className="text-sm font-medium text-muted-foreground">Business Name</span>
              <p className="font-semibold text-foreground">{nswsProfile?.businessName}</p>
            </div>
            <div className="space-y-1">
              <span className="text-sm font-medium text-muted-foreground">Registered Email</span>
              <p className="font-medium text-foreground">{nswsProfile?.email}</p>
            </div>
            <div className="space-y-1">
              <span className="text-sm font-medium text-muted-foreground">Tax Identity (PAN)</span>
              <div className="flex items-center gap-2">
                <p className="font-medium text-foreground tracking-widest">{nswsProfile?.panNumber}</p>
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              </div>
            </div>
            {nswsProfile?.dpiitId && (
              <div className="space-y-1">
                <span className="text-sm font-medium text-muted-foreground">DPIIT / NSWS ID</span>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 hover:bg-blue-50">
                    {nswsProfile.dpiitId}
                  </Badge>
                  <CheckCircle2 className="h-4 w-4 text-blue-500" />
                </div>
              </div>
            )}
          </div>
          
          <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 text-sm">
            <p>
              By continuing, your pre-filled business registration forms will automatically inherit these verified DPIIT and NSWS tags, expediting the application workflow.
            </p>
          </div>
        </CardContent>
        <CardFooter>
          <Button className="w-full text-base h-12" onClick={handleContinue}>
            Continue to Application Dashboard
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
