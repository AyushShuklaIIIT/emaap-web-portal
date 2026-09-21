import { BusinessUser, GatcUser, User, DashboardApplicationData } from "../types";
import { prisma } from "../lib/prisma";

export const findUserByUserId = async (
  userId: string,
): Promise<(User & { user_id: string }) | null> => {
  const user = await prisma.user.findUnique({
    where: {
      user_id: userId,
    },
  });

  return user ?? null;
};

export const findBusinessByUserId = async (
  userId: string,
): Promise<(BusinessUser & { business_id: string }) | null> => {
  const user = await findUserByUserId(userId);

  const business = await prisma.businessProfile.findUnique({
    where: {
      user_id: userId,
    },
    select: {
      business_id: true,
      registration_number: true,
      trade_name: true,
      entity_type: true,
      geo_address: true,
      state_id: true,
    },
  });

  if (!business) {
    return null;
  }

  const { state_id, ...rest } = business;

  return {
    ...rest,
    name: user.name,
    fullName: user.fullName ?? user.name,
    email: user.email,
    mobile: user.mobile ?? "",
    registrationRole: user.registrationRole as any,
    role: user.role as "BUSINESS",
    state_code: state_id,
  };
};

export const findGatcByUserId = async (
  userId: string,
): Promise<(GatcUser & { gatc_id: string }) | null> => {
  const user = await findUserByUserId(userId);
  const gatc = await prisma.gatcCentre.findUnique({
    where: { principal_officer_id: userId },
    select: {
      gatc_id: true,
      centre_code: true,
      approval_cert_no: true,
      ind_mark_code: true,
      valid_from: true,
      valid_to: true,
      status: true,
      approved_categories: true,
      lat: true,
      long: true,
    },
  });

  if (!gatc || !user) return null;

  return {
    ...gatc,
    name: user.name,
    fullName: user.fullName ?? user.name,
    email: user.email,
    mobile: user.mobile ?? "",
    registrationRole: user.registrationRole as any,
    role: user.role as "GATC_PRINCIPAL",
  };
};

export const getDashboardDetails = async (
  userId: string,
): Promise<{
  active_instruments: number;
  expires_in: number;
  pending: number;
}> => {
  const business = await findBusinessByUserId(userId);
  if (!business) return { active_instruments: 0, expires_in: 0, pending: 0 };

  const now = new Date();
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

  const [activeInstruments, expiringInstruments, pendingApplications] =
    await Promise.all([
      prisma.measuringInstrument.count({
        where: {
          business_id: business.business_id,
          status: "VERIFIED",
        },
      }),

      prisma.digitalCertificate.count({
        where: {
          instrument: {
            business_id: business.business_id,
          },
          expiry_date: {
            gte: now,
            lte: thirtyDaysFromNow,
          },
        },
      }),

      prisma.verificationApp.count({
        where: {
          business_id: business.business_id,
          workflow_status: {
            in: ["SUBMITTED", "ALLOCATED"],
          },
        },
      }),
    ]);

  return {
    active_instruments: activeInstruments,
    expires_in: expiringInstruments,
    pending: pendingApplications,
  };
};

export const getApplicationsByUserId = async (userId: string): Promise<DashboardApplicationData[]> => {
  const business = await findBusinessByUserId(userId);

  if (!business) {
    return [];
  }

  const applications = await prisma.verificationApp.findMany({
    where: {
      business_id: business.business_id,
    },

    include: {
      instrument: {
        include: {
          category: true,
          technical_specs: true,
          business: {
            include: {
              state: true,
              user: true,
            },
          },
          certificates: true,
        },
      },

      business: {
        include: {
          state: true,
          user: true,
        },
      },

      assigned_officer: true,

      assigned_gatc: {
        include: {
          principal_officer: true,
        },
      },

      receipts: true,

      inspections: {
        include: {
          inspector: true,

          certificate: {
            include: {
              instrument: true,
            },
          },

          seals: true,
        },
      },
    },

    orderBy: {
      submission_timestamp: "desc",
    },
  });

  return applications;
};
