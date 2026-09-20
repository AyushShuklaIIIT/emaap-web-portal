import axios, {
  AxiosError,
  type AxiosInstance,
  type AxiosRequestConfig,
} from "axios";
import { v4 as uuidv4 } from "uuid";
import { backendUrl } from "./backend-url";

export interface GatewayResponse<T> {
  success: boolean;
  statusCode: number;
  correlationId: string;
  data: T;
  error?: string;
}

export interface GatewayRequestConfig<T = unknown> {
  endpoint: string;
  method?: AxiosRequestConfig["method"];
  data?: T;
  timeout?: number;
  bypassMock?: boolean;
  headers?: Record<string, string>;
  signal?: AbortSignal;
}

export interface GatewayApiError {
  message: string;
  statusCode?: number;
  correlationId?: string;
  responseData?: unknown;
  isGatewayError: true;
}

export const gatewayClient: AxiosInstance = axios.create({ baseURL: backendUrl });

gatewayClient.interceptors.request.use((config) => {
  const token = window.localStorage.getItem("emaap_auth_token");
  config.headers.set("x-correlation-id", uuidv4());
  if (typeof FormData !== "undefined" && config.data instanceof FormData) {
    config.headers.delete("content-type");
    config.headers.delete("Content-Type");
  } else if (!config.headers.get("content-type")) {
    config.headers.set("content-type", "application/json");
  }
  if (token) config.headers.set("Authorization", `Bearer ${token}`);
  return config;
});

gatewayClient.interceptors.response.use(
  (response) => {
    const envelope = response.data as GatewayResponse<unknown> | undefined;
    if (envelope && typeof envelope === "object" && "success" in envelope && "data" in envelope) {
      if (!envelope.success) return Promise.reject(createGatewayError(envelope, response.status));
      response.data = envelope.data;
    }
    return response;
  },
  (error: AxiosError<GatewayResponse<unknown>>) =>
    Promise.reject(createGatewayError(error.response?.data, error.response?.status, error.message)),
);

function createGatewayError(
  envelope?: GatewayResponse<unknown>,
  statusCode?: number,
  fallbackMessage = "Gateway request failed",
): GatewayApiError {
  return {
    message: envelope?.error ?? fallbackMessage,
    statusCode: envelope?.statusCode ?? statusCode,
    correlationId: envelope?.correlationId,
    responseData: envelope?.data,
    isGatewayError: true,
  };
}

export function isGatewayApiError(error: unknown): error is GatewayApiError {
  return typeof error === "object" && error !== null && "isGatewayError" in error &&
    (error as { isGatewayError?: unknown }).isGatewayError === true;
}
