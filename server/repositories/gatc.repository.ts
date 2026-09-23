import { GatcStatus, PaymentStatus } from "../generated/prisma/enums";
import { prisma } from "../lib/prisma";
import { CreateGatcData, GatcListQuery, RenewGatcData } from "../types";

export const countGatcs = async () => {
  return prisma.gatcCentre.count();
};

export const countActiveGatcs = async () => {
  return prisma.gatcCentre.count({
    where: {
      status: GatcStatus.ACTIVE,
    },
  });
};

export const findGatcs = async ({
  search,
  status,
  page,
  limit,
}: GatcListQuery) => {
  const where = {
    ...(status
      ? {
          status,
        }
      : {}),

    ...(search
      ? {
          OR: [
            {
              centre_code: {
                contains: search,
                mode: "insensitive" as const,
              },
            },
            {
              approval_cert_no: {
                contains: search,
                mode: "insensitive" as const,
              },
            },
            {
              principal_officer: {
                name: {
                  contains: search,
                  mode: "insensitive" as const,
                },
              },
            },
          ],
        }
      : {}),
  };

  const [data, total] = await Promise.all([
    prisma.gatcCentre.findMany({
      where,
      skip: (page! - 1) * limit!,
      take: limit!,

      orderBy: {
        centre_code: "asc",
      },

      include: {
        principal_officer: {
          select: {
            user_id: true,
            name: true,
            email: true,
            mobile: true,
          },
        },
      },
    }),

    prisma.gatcCentre.count({
      where,
    }),
  ]);

  return {
    data,
    total,
  };
};

export const findRevenueForGatcs = async (
  gatcIds: string[],
  startDate: Date,
  endDate: Date,
) => {
  const receipts = await prisma.paymentReceipt.findMany({
    where: {
      payment_status: PaymentStatus.SUCCESS,

      transaction_date: {
        gte: startDate,
        lt: endDate,
      },

      application: {
        assigned_gatc_id: {
          in: gatcIds,
        },
      },
    },

    select: {
      total_amount: true,
      govt_share: true,
      gatc_share: true,

      application: {
        select: {
          assigned_gatc_id: true,
        },
      },
    },
  });

  return receipts;
};

export const countPendingRenewals = async (now: Date, expiryLimit: Date) => {
  return prisma.gatcCentre.count({
    where: {
      status: GatcStatus.ACTIVE,

      valid_to: {
        gte: now,
        lte: expiryLimit,
      },
    },
  });
};

export const findGatcById = async (gatcId: string) => {
  return prisma.gatcCentre.findUnique({
    where: {
      gatc_id: gatcId,
    },

    include: {
      principal_officer: {
        select: {
          user_id: true,
          name: true,
          email: true,
          mobile: true,
          employeeId: true,
        },
      },

      applications: {
        select: {
          app_id: true,
          application_no: true,
          workflow_status: true,

          inspections: {
            select: {
              inspection_id: true,
              test_verdict: true,
            },
          },

          receipts: {
            select: {
              payment_status: true,
              total_amount: true,
              govt_share: true,
              gatc_share: true,
            },
          },
        },
      },
    },
  });
};

export const createGatc = async (data: CreateGatcData) => {
  return prisma.gatcCentre.create({
    data: {
      centre_code: data.centre_code,
      approval_cert_no: data.approval_cert_no,
      ind_mark_code: data.ind_mark_code,

      valid_from: data.valid_from,
      valid_to: data.valid_to,

      status: GatcStatus.ACTIVE,

      approved_categories: data.approved_categories,

      lat: data.lat,
      long: data.long,

      principal_officer_id: data.principal_officer_id,
    },

    include: {
      principal_officer: {
        select: {
          user_id: true,
          name: true,
          email: true,
          mobile: true,
        },
      },
    },
  });
};

export const updateGatcStatus = async (gatcId: string, status: GatcStatus) => {
  return prisma.gatcCentre.update({
    where: {
      gatc_id: gatcId,
    },

    data: {
      status,
    },
  });
};

export const renewGatcByGatcId = async (
  gatcId: string,
  data: RenewGatcData,
) => {
  return prisma.gatcCentre.update({
    where: {
      gatc_id: gatcId,
    },

    data: {
      valid_from: data.valid_from,
      valid_to: data.valid_to,

      ...(data.approval_cert_no !== undefined && {
        approval_cert_no: data.approval_cert_no,
      }),

      ...(data.ind_mark_code !== undefined && {
        ind_mark_code: data.ind_mark_code,
      }),

      ...(data.approved_categories !== undefined && {
        approved_categories: data.approved_categories,
      }),

      status: GatcStatus.ACTIVE,
    },
  });
};

export const authorizeGatc = async (data: CreateGatcData) => {
  const principalOfficer = await prisma.user.findUnique({
    where: {
      user_id: data.principal_officer_id,
    },
  });

  if (!principalOfficer) {
    throw new Error("Principal officer not found");
  }

  if (principalOfficer.registrationRole !== "GATC_PRINCIPAL") {
    throw new Error("Selected user is not a GATC principal officer");
  }

  const existingCentre = await prisma.gatcCentre.findUnique({
    where: {
      centre_code: data.centre_code,
    },
  });

  if (existingCentre) {
    throw new Error("GATC centre code already exists");
  }

  const categories = await prisma.instrumentCategory.findMany({
    where: {
      category_code: {
        in: data.approved_categories,
      },
    },

    select: {
      category_code: true,
    },
  });

  const existingCodes = new Set(
    categories.map((category) => category.category_code),
  );

  const invalidCategories = data.approved_categories.filter(
    (code) => !existingCodes.has(code),
  );

  if (invalidCategories.length > 0) {
    throw new Error(`Invalid categories: ${invalidCategories.join(", ")}`);
  }

  if (data.valid_to <= data.valid_from) {
    throw new Error("valid_to must be after valid_from");
  }

  return createGatc(data);
};
