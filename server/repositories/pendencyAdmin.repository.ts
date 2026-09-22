import { prisma } from "../lib/prisma";

import {
  GatcStatus,
  RoleType,
  WorkflowStatus,
} from "../generated/prisma/enums";

export interface PendencyQuery {
  stateCode?: string;
  slaStatus: "ALL" | "BREACHED" | "WITHIN_SLA";
  breachedBefore: Date;
  withinSlaFrom: Date;
  skip: number;
  take: number;
}

const getBaseWhere = (query: PendencyQuery) => {
  const where: Record<string, unknown> = {
    workflow_status: WorkflowStatus.SUBMITTED,
  };

  if (query.stateCode && query.stateCode !== "ALL") {
    (
      where as {
        business?: unknown;
      }
    ).business = {
      state: {
        state_code: query.stateCode,
      },
    };
  }

  if (query.slaStatus === "BREACHED") {
    (
      where as {
        submission_timestamp?: unknown;
      }
    ).submission_timestamp = {
      lt: query.breachedBefore,
    };
  }

  if (query.slaStatus === "WITHIN_SLA") {
    (
      where as {
        submission_timestamp?: unknown;
      }
    ).submission_timestamp = {
      gte: query.withinSlaFrom,
    };
  }

  return where;
};

export const countPendencyApplications = async (query: PendencyQuery) => {
  const where = getBaseWhere(query);

  return prisma.verificationApp.count({
    where,
  });
};

export const getPendencyApplications = async (query: PendencyQuery) => {
  const where = getBaseWhere(query);

  return prisma.verificationApp.findMany({
    where,

    orderBy: {
      submission_timestamp: "asc",
    },

    skip: query.skip,
    take: query.take,

    include: {
      business: {
        include: {
          state: true,
          user: {
            select: {
              jurisdiction_district: true,
            },
          },
        },
      },

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
          approval_cert_no: true,
          status: true,
          approved_categories: true,
          lat: true,
          long: true,
          principal_officer_id: true,
        },
      },
    },
  });
};

export const countBreachedApplications = async (
  stateCode?: string,
  breachedBefore?: Date,
) => {
  if (!breachedBefore) {
    throw new Error("breachedBefore is required");
  }

  const where: Record<string, unknown> = {
    workflow_status: WorkflowStatus.SUBMITTED,

    submission_timestamp: {
      lt: breachedBefore,
    },
  };

  if (stateCode && stateCode !== "ALL") {
    (
      where as {
        business?: unknown;
      }
    ).business = {
      state: {
        state_code: stateCode,
      },
    };
  }

  return prisma.verificationApp.count({
    where,
  });
};

export const getEligibleGatcs = async (
  categoryCode: string,
  stateCode: string,
  district: string,
  categoryName: string,
) => {
  const now = new Date();

  const gatcs = await prisma.gatcCentre.findMany({
    where: {
      status: "ACTIVE",

      valid_from: {
        lte: now,
      },

      valid_to: {
        gte: now,
      },

      approved_categories: {
        has: categoryCode,
      },

      principal_officer: {
        jurisdiction_state: stateCode,
        jurisdiction_district: district,
      },
    },

    select: {
      gatc_id: true,
      centre_code: true,
      lat: true,
      long: true,
      approved_categories: true,

      principal_officer: {
        select: {
          user_id: true,
          name: true,
          jurisdiction_state: true,
        },
      },
    },
  });

  return gatcs;
};

export const getEligibleLmos = async (stateCode: string, district: string) => {
  return prisma.lmoOfficer.findMany({
    where: {
      user: {
        isActive: true,
        jurisdiction_state: stateCode,
        jurisdiction_district: district,
      },
    },
    orderBy: {
      user: {
        name: "asc",
      },
    },
    take: 5,
    select: {
      user_id: true,
      employee_code: true,
      user: {
        select: {
          name: true,
          jurisdiction_district: true,
          jurisdiction_state: true,
        },
      },
    },
  });
};

export const getAllEligibleGatcs = async (
  categoryCode: string,
  categoryName?: string,
) => {
  return prisma.gatcCentre.findMany({
    where: {
      status: GatcStatus.ACTIVE,

      OR: [
        { approved_categories: { has: categoryCode } },
        ...(categoryName
          ? [{ approved_categories: { has: categoryName } }]
          : []),
      ],
    },

    select: {
      gatc_id: true,
      centre_code: true,
      lat: true,
      long: true,
      approved_categories: true,
      status: true,
    },
  });
};

export const getActiveGatcById = async (gatcId: string) => {
  return prisma.gatcCentre.findFirst({
    where: {
      gatc_id: gatcId,
      status: GatcStatus.ACTIVE,
    },

    select: {
      gatc_id: true,
      centre_code: true,
      lat: true,
      long: true,
      status: true,
    },
  });
};

export const getLmoById = async (lmoId: string) => {
  return prisma.lmoOfficer.findFirst({
    where: {
      user_id: lmoId,
      user: {
        registrationRole: RoleType.LMO,
        isActive: true,
      },
    },

    select: {
      user_id: true,
      user: {
        select: {
          name: true,
          email: true,
          jurisdiction_district: true,
          jurisdiction_state: true,
        },
      },
    },
  });
};

export const getPendencyApplicationById = async (appId: string) => {
  return prisma.verificationApp.findUnique({
    where: {
      app_id: appId,
    },

    include: {
      business: {
        include: {
          state: true,
          user: {
            select: {
              jurisdiction_district: true,
            },
          },
        },
      },

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
          approval_cert_no: true,
          status: true,
          approved_categories: true,
          lat: true,
          long: true,
          principal_officer_id: true,
        },
      },
    },
  });
};

export const assignApplication = async (
  appId: string,
  assignedType: "LMO" | "GATC",
  assignedId: string,
) => {
  return prisma.verificationApp.update({
    where: {
      app_id: appId,
    },

    data: {
      assigned_officer_id: assignedType === "LMO" ? assignedId : null,

      assigned_gatc_id: assignedType === "GATC" ? assignedId : null,

      workflow_status: WorkflowStatus.ALLOCATED,
    },

    include: {
      assigned_officer: {
        select: {
          user_id: true,
          name: true,
          email: true,
        },
      },

      assigned_gatc: {
        select: {
          gatc_id: true,
          centre_code: true,
        },
      },
    },
  });
};
