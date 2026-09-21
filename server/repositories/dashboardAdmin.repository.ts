import { prisma } from "../lib/prisma";

import {
  GatcStatus,
  PaymentStatus,
  TestVerdict,
  RoleType,
  WorkflowStatus,
} from "../generated/prisma/enums";

export const getRevenueForPeriod = async (startDate: Date, endDate: Date) => {
  return prisma.paymentReceipt.aggregate({
    where: {
      payment_status: PaymentStatus.SUCCESS,
      transaction_date: {
        gte: startDate,
        lt: endDate,
      },
    },

    _sum: {
      total_amount: true,
      govt_share: true,
      gatc_share: true,
    },
  });
};

export const getActiveUnitCounts = async () => {
  const [activeGatcs, lmos] = await Promise.all([
    prisma.gatcCentre.count({
      where: {
        status: GatcStatus.ACTIVE,
      },
    }),

    prisma.user.count({
      where: {
        registrationRole: RoleType.INSPECTOR,
      },
    }),
  ]);

  return {
    active_gatcs: activeGatcs,
    lmos,
  };
};

export const getVerificationInspectionsForPeriod = async (
  startDate: Date,
  endDate: Date,
) => {
  return prisma.inspectionRecord.findMany({
    where: {
      inspection_date: {
        gte: startDate,
        lt: endDate,
      },

      test_verdict: TestVerdict.PASS,
    },

    select: {
      inspection_date: true,

      application: {
        select: {
          instrument_id: true,
          assigned_officer_id: true,
          assigned_gatc_id: true,
        },
      },
    },

    orderBy: {
      inspection_date: "asc",
    },
  });
};

export const getApplicationsForPendency = async (
  startDate: Date,
  endDate: Date,
) => {
  return prisma.verificationApp.findMany({
    where: {
      submission_timestamp: {
        gte: startDate,
        lt: endDate,
      },
    },

    select: {
      workflow_status: true,

      business: {
        select: {
          state: {
            select: {
              state_code: true,
              state_name: true,
            },
          },
        },
      },
    },
  });
};

export const getCertificatesForPeriod = async (
  startDate: Date,
  endDate: Date,
) => {
  return prisma.digitalCertificate.findMany({
    where: {
      issue_date: {
        gte: startDate,
        lt: endDate,
      },
    },

    select: {
      instrument_id: true,
    },
  });
};

export const getLiveAllocations = async () => {
  return prisma.verificationApp.findMany({
    where: {
      workflow_status: WorkflowStatus.ALLOCATED,
    },

    orderBy: {
      submission_timestamp: "desc",
    },

    take: 10,

    include: {
      instrument: {
        include: {
          category: true,
        },
      },

      assigned_officer: {
        select: {
          user_id: true,
          name: true,
          email: true,
          jurisdiction_district: true,
          jurisdiction_state: true,
        },
      },

      assigned_gatc: {
        select: {
          gatc_id: true,
          centre_code: true,
          lat: true,
          long: true,
        },
      },
    },
  });
};
