import { prisma } from "../lib/prisma";
import {
  AppType,
  PaymentStatus,
  WorkflowStatus,
} from "../generated/prisma/client";

export interface StateFinancialReceiptFilters {
  stateCode: string;
  startDate?: Date;
  endDate?: Date;
  search?: string;
  district?: string;
  gatcId?: string;
  applicationType?: AppType;
  workflowStatus?: WorkflowStatus;
  paymentStatus?: PaymentStatus;
}

const buildWhere = (filters: StateFinancialReceiptFilters) => {
  const where: any = {
    // STRICT BOUNDARY: Only applications belonging to businesses in this state
    application: {
      business: {
        state: {
          state_code: filters.stateCode,
        },
      },
    },
  };

  if (filters.district) {
    where.application.business.district = { district_name: filters.district };
  }

  if (filters.gatcId) {
    where.application.assigned_gatc_id = filters.gatcId;
  }

  if (filters.startDate || filters.endDate) {
    where.transaction_date = {};
    if (filters.startDate) where.transaction_date.gte = filters.startDate;
    if (filters.endDate) where.transaction_date.lte = filters.endDate;
  }

  if (filters.search?.trim()) {
    const search = filters.search.trim();
    where.OR = [
      { transaction_id: { contains: search, mode: "insensitive" } },
      { receipt_no: { contains: search, mode: "insensitive" } },
      {
        application: {
          business: { trade_name: { contains: search, mode: "insensitive" } },
        },
      },
      {
        application: {
          business: {
            registration_number: { contains: search, mode: "insensitive" },
          },
        },
      },
      {
        application: {
          instrument: {
            serial_number: { contains: search, mode: "insensitive" },
          },
        },
      },
    ];
  }

  if (filters.paymentStatus) where.payment_status = filters.paymentStatus;
  if (filters.applicationType)
    where.application.app_type = filters.applicationType;
  if (filters.workflowStatus)
    where.application.workflow_status = filters.workflowStatus;

  return where;
};

export const findStateFinancialReceipts = async (
  filters: StateFinancialReceiptFilters,
) => {
  return prisma.paymentReceipt.findMany({
    where: buildWhere(filters),
    include: {
      application: {
        include: {
          business: {
            select: {
              business_id: true,
              registration_number: true,
              trade_name: true,
              district: {
                select: { district_name: true },
              },
            },
          },
          instrument: {
            include: { category: { select: { category_name: true } } },
          },
        },
      },
    },
    orderBy: { transaction_date: "desc" },
  });
};

export const findStateFinancialTransactions = async (
  filters: StateFinancialReceiptFilters,
  page: number,
  limit: number,
) => {
  const where = buildWhere(filters);
  const [transactions, total] = await prisma.$transaction([
    prisma.paymentReceipt.findMany({
      where,
      include: {
        application: {
          include: {
            business: {
              select: {
                business_id: true,
                registration_number: true,
                trade_name: true,
                district: {
                  select: { district_name: true },
                },
              },
            },
            instrument: {
              include: { category: { select: { category_name: true } } },
            },
          },
        },
      },
      orderBy: { transaction_date: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.paymentReceipt.count({ where }),
  ]);

  return { transactions, total };
};
