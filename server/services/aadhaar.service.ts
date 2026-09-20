import {
  createCipheriv,
  createDecipheriv,
  createHash,
  publicEncrypt,
  privateDecrypt,
  randomBytes,
  randomUUID,
  constants,
} from "node:crypto";
import { logExternalApiCall } from "./external-api-audit.service";

export type AadhaarVerificationStatus = "VERIFIED" | "FAILED";

export interface AadhaarGenerateOtpInput {
  aadhaarNumber?: string;
  virtualId?: string;
  userId?: string;
}

export interface AadhaarVerifyOtpInput {
  otpCode: string;
  txnId: string;
  userId?: string;
}

export interface AadhaarVerificationResult {
  status: AadhaarVerificationStatus;
  maskedAadhaar: string;
  verificationToken?: string;
  txnId?: string;
  error?: string;
}

interface AadhaarIdentifier {
  value: string;
  masked: string;
}

interface PendingTransaction {
  identifier: AadhaarIdentifier;
  createdAt: number;
}

interface EncryptedPayload {
  encryptedKey: string;
  iv: string;
  authTag: string;
  ciphertext: string;
}

const pendingTransactions = new Map<string, PendingTransaction>();
const TRANSACTION_TTL_MS = 10 * 60 * 1000;

function isMockMode(): boolean {
  return process.env.MOCK_MODE?.toLowerCase() === "true";
}

function normalizeIdentifier(input: AadhaarGenerateOtpInput): AadhaarIdentifier {
  const supplied = input.aadhaarNumber ?? input.virtualId ?? "";
  const raw = supplied.replace(/[\s-]/g, "");
  const isAadhaar = Boolean(input.aadhaarNumber);
  const expectedLength = isAadhaar ? 12 : 16;

  if (!/^\d+$/.test(raw) || raw.length !== expectedLength || /^0+$/.test(raw)) {
    throw new Error(isAadhaar ? "Aadhaar number must contain 12 digits" : "Virtual ID must contain 16 digits");
  }

  return {
    value: raw,
    masked: `XXXX-XXXX-${raw.slice(-4)}`,
  };
}

function getRequiredEnvironment(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not configured`);
  return value;
}

function encryptIdentifier(identifier: AadhaarIdentifier): EncryptedPayload {
  const publicKey = getRequiredEnvironment("UIDAI_RSA_PUBLIC_KEY");
  const key = randomBytes(32);
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const ciphertext = Buffer.concat([
    cipher.update(JSON.stringify({ identifier: identifier.value }), "utf8"),
    cipher.final(),
  ]);
  const encryptedKey = publicEncrypt(
    {
      key: publicKey,
      padding: constants.RSA_PKCS1_OAEP_PADDING,
      oaepHash: "sha256",
    },
    key,
  );

  return {
    encryptedKey: encryptedKey.toString("base64"),
    iv: iv.toString("base64"),
    authTag: cipher.getAuthTag().toString("base64"),
    ciphertext: ciphertext.toString("base64"),
  };
}

function createVerificationToken(txnId: string, identifier: string): string {
  return createHash("sha256")
    .update(`${txnId}:${identifier}:${randomUUID()}`)
    .digest("hex");
}

function removeExpiredTransactions(): void {
  const cutoff = Date.now() - TRANSACTION_TTL_MS;
  for (const [txnId, transaction] of pendingTransactions) {
    if (transaction.createdAt < cutoff) pendingTransactions.delete(txnId);
  }
}

async function callUidai(
  endpoint: string,
  body: unknown,
): Promise<Record<string, unknown>> {
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-correlation-id": randomUUID(),
    },
    body: JSON.stringify(body),
  });
  const data = (await response.json().catch(() => null)) as Record<string, unknown> | null;
  if (!response.ok || !data) {
    throw new Error(`UIDAI request failed with status ${response.status}`);
  }
  return data;
}

export async function generateAadhaarOtp(
  input: AadhaarGenerateOtpInput,
): Promise<{ txnId: string; maskedAadhaar: string }> {
  const identifier = normalizeIdentifier(input);
  removeExpiredTransactions();

  if (isMockMode()) {
    const txnId = `MOCK-${randomUUID()}`;
    pendingTransactions.set(txnId, { identifier, createdAt: Date.now() });
    return { txnId, maskedAadhaar: identifier.masked };
  }

  const endpoint = getRequiredEnvironment("UIDAI_GENERATE_OTP_URL");
  const encryptedPayload = encryptIdentifier(identifier);
  const startedAt = Date.now();
  const response = await callUidai(endpoint, encryptedPayload);
  const txnId = typeof response.txnId === "string" ? response.txnId : undefined;
  if (!txnId) throw new Error("UIDAI response did not include a transaction ID");

  void logExternalApiCall({
    providerName: "UIDAI",
    endpoint,
    requestPayload: encryptedPayload,
    responsePayload: { ...response, txnId },
    statusCode: 200,
    latencyMs: Date.now() - startedAt,
    userId: input.userId,
  });
  pendingTransactions.set(txnId, { identifier, createdAt: Date.now() });
  return { txnId, maskedAadhaar: identifier.masked };
}

export async function verifyAadhaarOtp(
  input: AadhaarVerifyOtpInput,
): Promise<AadhaarVerificationResult> {
  removeExpiredTransactions();
  const transaction = pendingTransactions.get(input.txnId);
  if (!transaction) {
    return {
      status: "FAILED",
      maskedAadhaar: "XXXX-XXXX-XXXX",
      error: "Transaction ID is invalid or expired",
    };
  }

  if (!/^\d{4,8}$/.test(input.otpCode)) {
    return {
      status: "FAILED",
      maskedAadhaar: transaction.identifier.masked,
      error: "OTP must contain 4 to 8 digits",
    };
  }

  if (isMockMode()) {
    pendingTransactions.delete(input.txnId);
    const verified = input.otpCode === "123456";
    return {
      status: verified ? "VERIFIED" : "FAILED",
      maskedAadhaar: transaction.identifier.masked,
      ...(verified
        ? { verificationToken: createVerificationToken(input.txnId, transaction.identifier.value) }
        : { error: "OTP verification failed" }),
    };
  }

  const endpoint = getRequiredEnvironment("UIDAI_VERIFY_OTP_URL");
  const startedAt = Date.now();
  const response = await callUidai(endpoint, {
    txnId: input.txnId,
    otpCode: input.otpCode,
  });
  const verified = response.status === "VERIFIED" || response.verified === true;
  pendingTransactions.delete(input.txnId);
  void logExternalApiCall({
    providerName: "UIDAI",
    endpoint,
    requestPayload: { txnId: input.txnId, otpProvided: true },
    responsePayload: { status: verified ? "VERIFIED" : "FAILED" },
    statusCode: verified ? 200 : 401,
    latencyMs: Date.now() - startedAt,
    userId: input.userId,
  });

  return {
    status: verified ? "VERIFIED" : "FAILED",
    maskedAadhaar: transaction.identifier.masked,
    ...(verified
      ? { verificationToken: typeof response.verificationToken === "string" ? response.verificationToken : createVerificationToken(input.txnId, transaction.identifier.value) }
      : { error: "OTP verification failed" }),
  };
}

export function resetAadhaarTransactions(): void {
  pendingTransactions.clear();
}

export function decryptForTest(
  payload: EncryptedPayload,
  privateKey: string,
): string {
  const key = privateDecrypt(
    { key: privateKey, padding: constants.RSA_PKCS1_OAEP_PADDING, oaepHash: "sha256" },
    Buffer.from(payload.encryptedKey, "base64"),
  );
  const decipher = createDecipheriv("aes-256-gcm", key, Buffer.from(payload.iv, "base64"));
  decipher.setAuthTag(Buffer.from(payload.authTag, "base64"));
  return Buffer.concat([
    decipher.update(Buffer.from(payload.ciphertext, "base64")),
    decipher.final(),
  ]).toString("utf8");
}
