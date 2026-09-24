import { prisma } from "../lib/prisma";
import {
  GatcStatus,
  PaymentStatus,
  TestVerdict,
  RoleType,
  WorkflowStatus,
} from "../generated/prisma/enums";

export const getRevenueForStatePeriod = async (
  stateCode: string,
  startDate: Date,
  endDate: Date,
) => {
  return prisma.paymentReceipt.aggregate({
    where: {
      payment_status: PaymentStatus.SUCCESS,
      transaction_date: { gte: startDate, lt: endDate },
      application: {
        business: {
          state: {
            state_code: stateCode,
          },
        },
      },
    },
    _sum: { total_amount: true, govt_share: true, gatc_share: true },
  });
};

export const getActiveStateUnitCounts = async (stateCode: string) => {
  const [activeGatcs, lmos] = await Promise.all([
    prisma.gatcCentre.count({
      where: {
        status: GatcStatus.ACTIVE,
        // Using relationship based on seed datamodel
        principal_officer: { jurisdiction_state: stateCode },
      },
    }),
    prisma.user.count({
      where: {
        registrationRole: RoleType.LMO,
        jurisdiction_state: stateCode,
      },
    }),
  ]);
  return { active_gatcs: activeGatcs, lmos };
};

export const getStateVerificationInspectionsForPeriod = async (
  stateCode: string,
  startDate: Date,
  endDate: Date,
) => {
  return prisma.inspectionRecord.findMany({
    where: {
      inspection_date: { gte: startDate, lt: endDate },
      test_verdict: TestVerdict.PASS,
      application: {
        business: { state: { state_code: stateCode } },
      },
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
    orderBy: { inspection_date: "asc" },
  });
};

export const getStateApplicationsForPendency = async (
  stateCode: string,
  startDate: Date,
  endDate: Date,
) => {
  return prisma.verificationApp.findMany({
    where: {
      submission_timestamp: {
        gte: startDate,
        lt: endDate,
      },

      business: {
        state: {
          state_code: stateCode,
        },
      },
    },

    select: {
      workflow_status: true,

      business: {
        select: {
          district: {
            select: {
              district_name: true,
            },
          },
        },
      },
    },
  });
};

export const getStateCertificatesForPeriod = async (
  stateCode: string,
  startDate: Date,
  endDate: Date,
) => {
  return prisma.digitalCertificate.findMany({
    where: {
      issue_date: { gte: startDate, lt: endDate },
      inspection: {
        application: {
          business: { state: { state_code: stateCode } },
        }
      },
    },
    select: { instrument_id: true },
  });
};

export const getLiveStateAllocations = async (stateCode: string) => {
  return prisma.verificationApp.findMany({
    where: {
      workflow_status: WorkflowStatus.ALLOCATED,
      business: { state: { state_code: stateCode } },
    },
    orderBy: { submission_timestamp: "desc" },
    take: 10,
    include: {
      instrument: { include: { category: true } },
      assigned_officer: {
        select: {
          user_id: true,
          name: true,
          email: true,
          jurisdiction_district: true,
        },
      },
      assigned_gatc: {
        select: { gatc_id: true, centre_code: true, lat: true, long: true },
      },
    },
  });
};

export const getStateGatcs = async (stateCode: string, district?: string) => {
  return prisma.gatcCentre.findMany({
    where: {
      principal_officer: {
        jurisdiction_state: stateCode,
        ...(district && { jurisdiction_district: { district_name: district } })
      }
    },
    orderBy: { centre_code: "asc" },
    include: {
      principal_officer: {
        select: {
          user_id: true,
          name: true,
          email: true,
          mobile: true,
          jurisdiction_district: {
            select: { district_name: true }
          },
        },
      },
    },
  });
};
