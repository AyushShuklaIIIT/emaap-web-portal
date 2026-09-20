/**
 * Shared code between client and server
 * Useful to share types between client and server
 * and/or small pure JS functions that can be used on both client and server
 */

/**
 * Example response type for /api/demo
 */
export interface DemoResponse {
  message: string;
}

export interface GatewayProxyRequest {
  targetUrl: string;
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
  timeoutMs?: number;
  retryCount?: number;
}

export interface GatewayResponse<T = unknown> {
  success: boolean;
  statusCode: number;
  correlationId: string;
  data: T;
  error?: string;
}
