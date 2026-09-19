import crypto from "node:crypto";
import { logExternalApiCall } from "./external-api-audit.service";

export interface DigilockerTokenResponse {
  accessToken: string;
  expiresIn: number;
  refreshToken?: string;
}

export interface DigilockerPushInput {
  userDigilockerId: string; // or Aadhaar ID (will be hashed locally)
  documentType: string;
  pdfBuffer: Buffer;
  metadataJson: Record<string, string>;
  reason?: string;
}

export interface DigilockerPushOutput {
  documentUri: string;
  syncStatus: "SUCCESS" | "FAILED";
  transactionId: string;
}

export interface DigilockerPullInput {
  documentUri: string;
  userDigilockerId: string;
}

export interface DigilockerPullOutput {
  pdfBuffer: Buffer;
  metadataJson: Record<string, string>;
  syncStatus: "SUCCESS" | "FAILED";
}

const DIGILOCKER_API_BASE = process.env.DIGILOCKER_API_BASE || "https://api.digitallocker.gov.in/public/oauth2";
const CLIENT_ID = process.env.DIGILOCKER_CLIENT_ID || "demo_client_id";
const CLIENT_SECRET = process.env.DIGILOCKER_CLIENT_SECRET || "demo_client_secret";
const REDIRECT_URI = process.env.DIGILOCKER_REDIRECT_URI || "https://emaap.local/api/v1/nsws/digilocker/callback";

/**
 * DPDP Act Compliance: Hash Aadhaar IDs before external transmission or logging.
 */
function hashIdentifier(identifier: string): string {
  // If it's a 12 digit number, it's an Aadhaar. Hash it.
  if (/^\d{12}$/.test(identifier)) {
    return crypto.createHash("sha256").update(identifier).digest("hex");
  }
  return identifier;
}

/**
 * Builds the XML metadata required by DigiLocker Push APIs.
 */
function buildMetadataXml(documentType: string, metadataJson: Record<string, string>): string {
  const elements = Object.entries(metadataJson)
    .map(([key, value]) => `<${key}>${value}</${key}>`)
    .join("\n      ");

  return `<?xml version="1.0" encoding="UTF-8"?>
<DocumentMetadata>
  <DocumentType>${documentType}</DocumentType>
  <DocumentDetails>
    ${elements}
  </DocumentDetails>
</DocumentMetadata>`;
}

/**
 * Implements OAuth 2.0 flow for authorization code exchange.
 */
export async function exchangeAuthCode(code: string): Promise<DigilockerTokenResponse> {
  const endpoint = `${DIGILOCKER_API_BASE}/1/token`;
  const startedAt = Date.now();
  let statusCode = 502;

  try {
    const params = new URLSearchParams();
    params.append("code", code);
    params.append("grant_type", "authorization_code");
    params.append("client_id", CLIENT_ID);
    params.append("client_secret", CLIENT_SECRET);
    params.append("redirect_uri", REDIRECT_URI);

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });

    statusCode = response.status;
    if (!response.ok) {
      throw new Error(`DigiLocker Auth API returned status ${statusCode}`);
    }

    const data = await response.json() as any;

    await logExternalApiCall({
      providerName: "DIGILOCKER_AUTH",
      endpoint,
      requestPayload: { grant_type: "authorization_code" },
      responsePayload: { success: true },
      statusCode,
      latencyMs: Date.now() - startedAt,
    });

    return {
      accessToken: data.access_token,
      expiresIn: data.expires_in,
      refreshToken: data.refresh_token,
    };
  } catch (error) {
    await logExternalApiCall({
      providerName: "DIGILOCKER_AUTH",
      endpoint,
      requestPayload: { grant_type: "authorization_code" },
      responsePayload: { error: error instanceof Error ? error.message : "Auth exchange failed" },
      statusCode,
      latencyMs: Date.now() - startedAt,
    });
    throw error;
  }
}

/**
 * Pushes signed certificates to the user's DigiLocker Document Vault.
 */
export async function pushDocument(input: DigilockerPushInput, accessToken: string): Promise<DigilockerPushOutput> {
  const transactionId = crypto.randomUUID();
  const endpoint = `${DIGILOCKER_API_BASE}/2/file/push`;
  const startedAt = Date.now();
  let statusCode = 502;

  const hashedId = hashIdentifier(input.userDigilockerId);
  const base64Pdf = input.pdfBuffer.toString("base64");
  const xmlMetadata = buildMetadataXml(input.documentType, input.metadataJson);

  try {
    const payload = {
      txnId: transactionId,
      digilockerId: hashedId,
      documentType: input.documentType,
      fileContent: base64Pdf,
      xmlMetadata: xmlMetadata,
    };

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "x-correlation-id": transactionId,
      },
      body: JSON.stringify(payload),
    });

    statusCode = response.status;
    if (!response.ok) {
      throw new Error(`DigiLocker Push API returned status ${statusCode}`);
    }

    const data = await response.json() as any;
    const documentUri = data.uri || `in.gov.digilocker-${crypto.randomBytes(4).toString("hex")}`;

    await logExternalApiCall({
      providerName: "DIGILOCKER_PUSH",
      endpoint,
      requestPayload: {
        txnId: transactionId,
        documentType: input.documentType,
        digilockerIdMasked: hashedId,
        metadata: input.metadataJson,
      },
      responsePayload: { documentUri, success: true },
      statusCode,
      latencyMs: Date.now() - startedAt,
    });

    return {
      documentUri,
      syncStatus: "SUCCESS",
      transactionId,
    };
  } catch (error) {
    await logExternalApiCall({
      providerName: "DIGILOCKER_PUSH",
      endpoint,
      requestPayload: {
        txnId: transactionId,
        documentType: input.documentType,
        digilockerIdMasked: hashedId,
      },
      responsePayload: { error: error instanceof Error ? error.message : "Push failed" },
      statusCode,
      latencyMs: Date.now() - startedAt,
    });

    return {
      documentUri: "",
      syncStatus: "FAILED",
      transactionId,
    };
  }
}

/**
 * Retrieves user-uploaded credentials from the DigiLocker Document Vault.
 */
export async function pullDocument(input: DigilockerPullInput, accessToken: string): Promise<DigilockerPullOutput> {
  const transactionId = crypto.randomUUID();
  // Standard format relies on URI being passed into the path or querystring
  const endpoint = `${DIGILOCKER_API_BASE}/1/file/pull?uri=${encodeURIComponent(input.documentUri)}`;
  const startedAt = Date.now();
  let statusCode = 502;
  const hashedId = hashIdentifier(input.userDigilockerId);

  try {
    const response = await fetch(endpoint, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Accept": "application/json", // Some endpoints return JSON with base64, others raw PDF. Assuming JSON envelope.
        "x-correlation-id": transactionId,
      },
    });

    statusCode = response.status;
    if (!response.ok) {
      throw new Error(`DigiLocker Pull API returned status ${statusCode}`);
    }

    const data = await response.json() as any;
    const pdfBuffer = Buffer.from(data.fileContent, "base64");
    const metadataJson = data.metadata || {};

    await logExternalApiCall({
      providerName: "DIGILOCKER_PULL",
      endpoint,
      requestPayload: {
        txnId: transactionId,
        documentUri: input.documentUri,
        digilockerIdMasked: hashedId,
      },
      responsePayload: { success: true },
      statusCode,
      latencyMs: Date.now() - startedAt,
    });

    return {
      pdfBuffer,
      metadataJson,
      syncStatus: "SUCCESS",
    };
  } catch (error) {
    await logExternalApiCall({
      providerName: "DIGILOCKER_PULL",
      endpoint,
      requestPayload: {
        txnId: transactionId,
        documentUri: input.documentUri,
        digilockerIdMasked: hashedId,
      },
      responsePayload: { error: error instanceof Error ? error.message : "Pull failed" },
      statusCode,
      latencyMs: Date.now() - startedAt,
    });

    throw error;
  }
}
