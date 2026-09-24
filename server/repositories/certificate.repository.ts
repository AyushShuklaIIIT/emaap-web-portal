import { prisma } from "../lib/prisma";
import { createCertificateSignature } from "../services/qr-payload.service";

export const getCertificatesByBusinessId = async (businessId: string) => {
  const now = new Date(); // Current date/time

  const certs = await prisma.digitalCertificate.findMany({
    where: {
      OR: [
        {
          rejection_reason: null,
        },

        {
          rejection_reason: {
            not: null,
          },
          expiry_date: {
            gt: now,
          },
        },
      ],
    },
  });

  return certs.map((cert) => ({
    ...cert,
    verificationSignature: createCertificateSignature(
      cert.cert_id,
      cert.sha256_hash,
    ),
  }));
};
