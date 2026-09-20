import { createHash, createHmac, timingSafeEqual } from "node:crypto";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function getQrSecret(): string {
  const secret = process.env.QR_SIGNING_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("QR_SIGNING_SECRET must be configured with at least 32 characters");
  }
  return secret;
}

export function createSignedVerificationUrl(
  certificateId: string,
  pdfBuffer: Buffer,
): string {
  if (!UUID_PATTERN.test(certificateId)) throw new Error("Invalid certificate UUID");
  if (!Buffer.isBuffer(pdfBuffer) || pdfBuffer.length === 0) {
    throw new Error("A non-empty PDF-A buffer is required");
  }
  const documentHash = createHash("sha256").update(pdfBuffer).digest("hex");
  const signature = createHmac("sha256", getQrSecret())
    .update(documentHash)
    .digest("base64url");
  const baseUrl = process.env.PUBLIC_BACKEND_URL?.replace(/\/+$/, "");
  if (!baseUrl) throw new Error("PUBLIC_BACKEND_URL is not configured");
  return `${baseUrl}/verify/${certificateId}?sig=${encodeURIComponent(signature)}`;
}

export function createCertificateSignature(
  certificateId: string,
  documentHash: string,
): string {
  if (!UUID_PATTERN.test(certificateId)) throw new Error("Invalid certificate UUID");
  if (!/^[0-9a-f]{64}$/i.test(documentHash)) throw new Error("Invalid document hash");
  return createHmac("sha256", getQrSecret())
    .update(documentHash)
    .digest("base64url");
}

export function verifyCertificateSignature(
  documentHash: string,
  suppliedSignature: string,
): boolean {
  try {
    const expected = createHmac("sha256", getQrSecret())
      .update(documentHash)
      .digest("base64url");
    const expectedBuffer = Buffer.from(expected);
    const suppliedBuffer = Buffer.from(suppliedSignature);
    return (
      expectedBuffer.length === suppliedBuffer.length &&
      timingSafeEqual(expectedBuffer, suppliedBuffer)
    );
  } catch {
    return false;
  }
}
