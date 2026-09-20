import { prisma } from "../lib/prisma";

export const getCertificatesByBusinessId = async (businessId: string) => {
  return prisma.digitalCertificate.findMany({
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
};
