import { logExternalApiCall } from "./external-api-audit.service";

export async function sendWelcomeEmail(input: {
  email: string;
  fullName: string;
  role: string;
}): Promise<boolean> {
  if (process.env.MOCK_MODE?.toLowerCase() === "true") return true;
  const endpoint = process.env.WELCOME_EMAIL_API_URL;
  if (!endpoint) throw new Error("WELCOME_EMAIL_API_URL is not configured");

  const startedAt = Date.now();
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      email: input.email,
      fullName: input.fullName,
      role: input.role,
      message: "Your eMaap account has been approved. Sign in with your registered credentials.",
    }),
  });
  const responsePayload = await response.json().catch(() => null);
  void logExternalApiCall({
    providerName: "WELCOME_EMAIL",
    endpoint,
    requestPayload: { email: input.email, role: input.role },
    responsePayload,
    statusCode: response.status,
    latencyMs: Date.now() - startedAt,
  });
  if (!response.ok) throw new Error(`Welcome email provider returned ${response.status}`);
  return true;
}
