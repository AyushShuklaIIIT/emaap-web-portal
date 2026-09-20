import { prisma } from "../lib/prisma";

export const getPaymentReceiptsByBusinessId = async (businessId: string) => {
  return prisma.paymentReceipt.findMany({
    where: {
      application: {
        business_id: businessId,
      },
    },
    include: {
      application: {
        include: {
          instrument: {
            include: {
              category: true,
            },
          },
        },
      },
    },
    orderBy: {
      transaction_date: "desc",
    },
  });
};

export const getPaymentReceiptById = async (
  businessId: string,
  receiptId: string,
) => {
  return prisma.paymentReceipt.findFirst({
    where: {
      receipt_id: receiptId,

      application: {
        business_id: businessId,
      },
    },
    include: {
      application: {
        include: {
          instrument: {
            include: {
              category: true,
            },
          },
        },
      },
    },
  });
};
