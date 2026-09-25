import { PaymentMethod } from "../generated/prisma/enums";
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
              district: true,
            },
          },
        },
      },
    },
  });
};

export const createPaymentReceiptRepo = async (params: {
  receipt_id: string;
  receipt_no: string;
  transaction_id: string;
  payment_method: PaymentMethod;
  total_amount: number;
  statutory_fee: number;
  app_id: string;
}) => {
  await prisma.verificationApp.update({
    where: {
      app_id: params.app_id,
    },
    data: {
      workflow_status: "SUBMITTED",
    },
  });

  return prisma.paymentReceipt.upsert({
    where: {
      app_id: params.app_id,
    },
    update: {
      transaction_id: params.transaction_id,
      transaction_date: new Date(),
      payment_method: params.payment_method,
      payment_status: "SUCCESS",
    },
    create: {
      receipt_id: params.receipt_id,
      receipt_no: params.receipt_no,
      transaction_id: params.transaction_id,
      transaction_date: new Date(),
      payment_method: params.payment_method,
      due_date: null,
      statutory_fee: params.statutory_fee,
      carriage_charges: 0,
      adjusting_charges: 0,
      total_amount: params.total_amount,
      govt_share: params.total_amount * 0.3,
      gatc_share: params.total_amount * 0.7,
      payment_status: "SUCCESS",
      app_id: params.app_id,
    },
  });
};
