import { prisma } from "../lib/prisma";
import { createCertificateSignature } from "../services/qr-payload.service";

export const getCertificatesByBusinessId = async (businessId: string) => {
  const certs = await prisma.digitalCertificate.findMany({
    where: {
      instrument: {
        business_id: businessId,
      },
    },

    include: {
      instrument: {
        include: {
          category: true,
        },
      },
    },

    orderBy: {
      issue_date: "desc",
    },
  });

  return certs.map((cert) => ({
    ...cert,
    verificationSignature: createCertificateSignature(cert.cert_id, cert.sha256_hash),
  }));
};
