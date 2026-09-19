---
name: generate-qr-payload
description: Implements the statutory high-density QR code cryptographic payload for Legal Metrology verification certificates.
---

<!-- Tip: Use /create-skill in chat to generate content with agent assistance -->

## Task
Generate the TypeScript logic to construct the secure verification URL embedded in the certificate QR code, ensuring protection against tampering.

## Workflow
1. Accept the `certificateID` (UUID from the `certificates` table) and the raw PDF-A buffer as inputs.
2. Compute the SHA-256 hash of the PDF buffer.
3. Compute an HMAC signature of the SHA-256 hash using the platform's private secret key.
4. Base-64 encode the resulting HMAC signature.
5. Construct the payload string as: `{process.env.PUBLIC_BACKEND_URL}/verify/<UUID>?sig=<Base64_HMAC>`
6. Utilize the `qrcode` (ZXing) library to generate the visual buffer for frontend rendering.

## Constraint
Ensure the generated code includes robust error handling for missing buffers or invalid UUIDs. Follow global instructions and output `CODE ONLY`.