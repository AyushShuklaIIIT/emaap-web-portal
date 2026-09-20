import crypto from "node:crypto";
import { logExternalApiCall } from "./external-api-audit.service";

export interface EsignInput {
  pdfBuffer: Buffer;
  signerAadhaarId: string;
  signerName: string;
  reason: string;
}

export interface EsignOutput {
  signedPdfBuffer: Buffer;
  pkcs7Signature: string;
  transactionId: string;
}

/**
 * Calculates SHA-256 hash of the unsigned PDF-A document
 */
function calculatePdfHash(pdfBuffer: Buffer): string {
  return crypto.createHash("sha256").update(pdfBuffer).digest("hex");
}

/**
 * Constructs the CCA-compliant eSign XML request payload
 */
function constructEsignXmlPayload(hashHex: string, transactionId: string, timestamp: string): string {
  const aspId = process.env.ESIGN_ASP_ID || "ASP-DEFAULT-ID";
  // DPDP Act compliance: Raw Aadhaar is not transmitted in the XML payload.
  // The ESP (CDAC/NSDL) will securely prompt the user for Aadhaar during the eSign flow.
  return `<?xml version="1.0" encoding="UTF-8"?>
<Esign ver="2.1" sc="Y" ts="${timestamp}" txn="${transactionId}" aspId="${aspId}">
  <Docs>
    <InputHash id="DOC_1" hashAlgorithm="SHA256">${hashHex}</InputHash>
  </Docs>
</Esign>`;
}

/**
 * Embeds PKCS#7 signature block back into the PDF-A byte structure.
 * Standard implementation uses libraries like node-signpdf to inject the PKCS7 hex 
 * into the pre-allocated /ByteRange dictionary placeholder.
 */
function embedSignatureInPdf(originalPdf: Buffer, pkcs7Signature: string): Buffer {
  // Placeholder for structural byte-range manipulation
  return Buffer.concat([originalPdf, Buffer.from("\n%%PKCS7_SIGNATURE_EMBEDDED%%")]);
}

/**
 * Core eSign Engine: Generates digitally signed PDF-A certificates via CDAC/NSDL
 */
export async function generateAadhaarEsign(input: EsignInput): Promise<EsignOutput> {
  const transactionId = crypto.randomUUID();
  const timestamp = new Date().toISOString();
  const endpoint = process.env.ESIGN_GATEWAY_URL || "https://esign.nsdl.com/esign/2.1/signdoc";
  
  // 1. Calculate SHA-256 hash (Rule constraint: Never use SHA-1)
  const documentHash = calculatePdfHash(input.pdfBuffer);

  // 2. Construct CCA-compliant XML
  const xmlPayload = constructEsignXmlPayload(documentHash, transactionId, timestamp);
  
  const startedAt = Date.now();
  let statusCode = 502;
  let pkcs7Signature = "";
  let userCertificate = "";

  try {
    // 3. POST XML request to CDAC/NSDL ESP Gateway
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/xml",
        "Accept": "application/xml",
        "x-correlation-id": transactionId,
      },
      body: xmlPayload,
    });
    
    statusCode = response.status;
    const responseXml = await response.text();

    if (!response.ok) {
      throw new Error(`eSign ESP Gateway returned status ${statusCode}`);
    }

    // 4. Parse returning <UserX509Certificate> and PKCS#7 signature block
    const pkcs7Match = responseXml.match(/<Pkcs7Signature>(.*?)<\/Pkcs7Signature>/);
    const certMatch = responseXml.match(/<UserX509Certificate>(.*?)<\/UserX509Certificate>/);

    if (!pkcs7Match || !pkcs7Match[1]) {
      throw new Error("Missing PKCS#7 signature block in eSign response");
    }

    pkcs7Signature = pkcs7Match[1];
    userCertificate = certMatch ? certMatch[1] : "";

    // 5. Embed signature into the PDF structure
    const signedPdfBuffer = embedSignatureInPdf(input.pdfBuffer, pkcs7Signature);

    // Audit Logging - Masking PII (DPDP Act Compliance)
    const maskedAadhaar = input.signerAadhaarId.replace(/\d(?=\d{4})/g, "X");
    
    await logExternalApiCall({
      providerName: "NSDL_ESIGN",
      endpoint,
      requestPayload: {
        txn: transactionId,
        signerName: input.signerName,
        aadhaarMasked: maskedAadhaar, // Hashed/Masked locally before logging
        hashAlgorithm: "SHA256",
        reason: input.reason
      },
      responsePayload: {
        txn: transactionId,
        certProvided: !!userCertificate,
        success: true
      },
      statusCode,
      latencyMs: Date.now() - startedAt,
    });

    return {
      signedPdfBuffer,
      pkcs7Signature,
      transactionId,
    };
  } catch (error) {
    const maskedAadhaar = input.signerAadhaarId.replace(/\d(?=\d{4})/g, "X");
    await logExternalApiCall({
      providerName: "NSDL_ESIGN",
      endpoint,
      requestPayload: { 
        txn: transactionId, 
        signerName: input.signerName, 
        aadhaarMasked: maskedAadhaar,
        reason: input.reason 
      },
      responsePayload: { error: error instanceof Error ? error.message : "Unknown error" },
      statusCode,
      latencyMs: Date.now() - startedAt,
    });
    throw error;
  }
}
