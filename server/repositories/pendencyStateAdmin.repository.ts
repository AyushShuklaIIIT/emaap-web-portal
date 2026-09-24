import { prisma } from "../lib/prisma";
import { WorkflowStatus } from "../generated/prisma/enums";

export interface StatePendencyQuery {
  stateCode: string;
  district?: string;
  slaStatus: "ALL" | "BREACHED" | "WITHIN_SLA";
  breachedBefore: Date;
  withinSlaFrom: Date;
  skip: number;
  take: number;
}

const getBaseWhere = (query: StatePendencyQuery) => {
  const where: any = {
    workflow_status: WorkflowStatus.SUBMITTED,
    business: {
      state: { state_code: query.stateCode },
    },
  };

  if (query.district) {
    where.business.district = { district_name: query.district };
  }

  if (query.slaStatus === "BREACHED") {
    where.submission_timestamp = { lt: query.breachedBefore };
  } else if (query.slaStatus === "WITHIN_SLA") {
    where.submission_timestamp = { gte: query.withinSlaFrom };
  }

  return where;
};

export const countStatePendencyApplications = async (
  query: StatePendencyQuery,
) => {
  return prisma.verificationApp.count({ where: getBaseWhere(query) });
};

export const getStatePendencyApplications = async (
  query: StatePendencyQuery,
) => {
  return prisma.verificationApp.findMany({
    where: getBaseWhere(query),
    orderBy: { submission_timestamp: "asc" },
    skip: query.skip,
    take: query.take,
    include: {
      business: { include: { state: true, district: true } },
      instrument: { include: { category: true } },
      assigned_officer: { select: { name: true } },
      assigned_gatc: { select: { centre_code: true } },
    },
  });
};

export const countStateBreachedApplications = async (
  stateCode: string,
  district?: string,
  breachedBefore?: Date,
) => {
  const where: any = {
    workflow_status: WorkflowStatus.SUBMITTED,
    submission_timestamp: { lt: breachedBefore },
    business: { state: { state_code: stateCode } },
  };
  if (district) where.business.district = { district_name: district };

  return prisma.verificationApp.count({ where });
};
