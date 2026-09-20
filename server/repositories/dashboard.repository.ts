import {
  BusinessUser,
  GatcUser,
  User,
  VerificationCertificateApp,
} from "../types";
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
    email: user.email,
    role: user.role,
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

  if (gatc) {
    return { ...gatc, name: user.name, email: user.email, role: user.role };
  }
  return null;
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

export const getApplicationsByUserId = async (
  userId: string,
): Promise<VerificationCertificateApp[]> => {
  const business = await findBusinessByUserId(userId);
  if (!business) return [];

  const applications = await prisma.verificationApp.findMany({
    where: { business_id: business.business_id },
    select: {
      app_id: true,
      application_no: true,
      app_type: true,
      submission_timestamp: true,
      workflow_status: true,
      instrument_id: true,
      business_id: true,
      assigned_officer_id: true,
      assigned_gatc_id: true,
    },
  });

  const verifiedApplications = applications.filter(
    (e) => e.workflow_status === "CERTIFIED",
  );

  const inspections = await prisma.inspectionRecord.findMany({
    where: {
      app_id: {
        in: verifiedApplications.map((e) => e.app_id),
      },
    },
    select: {
      app_id: true,
      certificate: {
        select: {
          cert_id: true,
        },
      },
    },
  });

  return applications.map((application) => {
    const inspection = inspections.find(
      (inspection) => inspection.app_id === application.app_id,
    );

    return {
      ...application,
      digital_certificate_id:
        application.workflow_status === "CERTIFIED"
          ? (inspection?.certificate?.cert_id ?? null)
          : null,
    };
  });
};
