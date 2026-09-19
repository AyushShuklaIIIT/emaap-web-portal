import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { toast } from "@/hooks/use-toast";
import {
  gatewayClient,
  isGatewayApiError,
  type GatewayRequestConfig,
} from "@/lib/gatewayClient";
import { mockMode } from "@/lib/backend-url";

interface GatewayApiState {
  isLoading: boolean;
  isRetrying: boolean;
  attemptCount: number;
}

interface GatewayApiContextValue extends GatewayApiState {
  request<T = unknown, D = unknown>(
    config: GatewayRequestConfig<D>,
  ): Promise<T>;
}

const GatewayApiContext = createContext<GatewayApiContextValue | undefined>(
  undefined,
);

const RETRYABLE_STATUS_CODES = new Set([502, 503, 504]);
const MAX_ATTEMPTS = 3;
const RETRY_DELAY_MS = 1000;

const mockFixtures: Record<string, unknown> = {
  "/api/v1/gateway/aadhaar/generate-otp": {
    txnId: "MOCK-FIXTURE-TXN",
    maskedAadhaar: "XXXX-XXXX-9012",
  },
  "/api/v1/gateway/aadhaar/verify-otp": {
    status: "VERIFIED",
    maskedAadhaar: "XXXX-XXXX-9012",
    verificationToken: "mock-verification-token",
  },
  "/api/v1/gateway/gstn/verify": {
    gstin: "09ABCDE1234F1Z5",
    legalName: "eMaap Sandbox Business",
    tradeName: "eMaap Sandbox",
    taxpayerType: "REGULAR",
    activeStatus: "ACTIVE",
    stateCode: "09",
    address: {
      stateCode: "09",
      state: "Sandbox State",
      district: "Sandbox District",
      pincode: "000000",
    },
  },
};

function wait(delayMs: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, delayMs));
}

export function GatewayApiProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<GatewayApiState>({
    isLoading: false,
    isRetrying: false,
    attemptCount: 0,
  });

  const request = useCallback(
    async <T, D>(config: GatewayRequestConfig<D>): Promise<T> => {
      const fixture = mockFixtures[config.endpoint];
      if (mockMode && !config.bypassMock && fixture !== undefined) {
        setState({ isLoading: true, isRetrying: false, attemptCount: 1 });
        await wait(800);
        setState({ isLoading: false, isRetrying: false, attemptCount: 1 });
        return fixture as T;
      }

      let attempt = 0;
      setState({ isLoading: true, isRetrying: false, attemptCount: 1 });

      try {
        while (true) {
          attempt += 1;
          setState((current) => ({
            ...current,
            isRetrying: attempt > 1,
            attemptCount: attempt,
          }));

          try {
            const response = await gatewayClient.request<T>({
              url: config.endpoint,
              method: config.method ?? "GET",
              data: config.data,
              timeout: config.timeout,
              headers: config.headers,
              signal: config.signal,
            });
            return response.data;
          } catch (error) {
            const statusCode = isGatewayApiError(error)
              ? error.statusCode
              : undefined;
            const canRetry =
              statusCode !== undefined &&
              RETRYABLE_STATUS_CODES.has(statusCode) &&
              attempt < MAX_ATTEMPTS;

            if (!canRetry) {
              throw error;
            }

            const seconds = RETRY_DELAY_MS / 1000;
            toast({
              title: "Gateway temporarily unavailable",
              description: `Retrying in ${seconds} second${seconds === 1 ? "" : "s"} (attempt ${attempt + 1}/${MAX_ATTEMPTS}).`,
              variant: "destructive",
            });
            await wait(RETRY_DELAY_MS);
          }
        }
      } catch (error) {
        const gatewayError = isGatewayApiError(error)
          ? error
          : {
              message: "Unable to reach the gateway",
              isGatewayError: true as const,
            };
        toast({
          title: "Request failed",
          description: gatewayError.correlationId
            ? `${gatewayError.message} (Correlation ID: ${gatewayError.correlationId})`
            : gatewayError.message,
          variant: "destructive",
        });
        throw gatewayError;
      } finally {
        setState((current) => ({
          ...current,
          isLoading: false,
          isRetrying: false,
        }));
      }
    },
    [],
  );

  const value = useMemo(() => ({ ...state, request }), [request, state]);
  return (
    <GatewayApiContext.Provider value={value}>
      {children}
    </GatewayApiContext.Provider>
  );
}

export function useGatewayApi(): GatewayApiContextValue {
  const context = useContext(GatewayApiContext);
  if (!context) {
    throw new Error("useGatewayApi must be used within GatewayApiProvider");
  }
  return context;
}
