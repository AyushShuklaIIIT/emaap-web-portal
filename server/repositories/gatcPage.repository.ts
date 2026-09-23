import {
  RoleType,
  ApplicationStatus,
  PaymentStatus,
} from "../generated/prisma/enums";
import { prisma } from "../lib/prisma";

export const findPrincipalGatcRepository = async (userId: string) => {
  return prisma.user.findUnique({
    where: {
      user_id: userId,
    },
    select: {
      user_id: true,
      name: true,
      fullName: true,
      email: true,
      mobile: true,
      registrationRole: true,
      jurisdiction_district: true,
      jurisdiction_state: true,
      emailVerified: true,
      mobileVerified: true,
      gatc_centres: {
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
      },
    },
  });
};

export const findGatcOfficersRepository = async (gatcId: string) => {
  return prisma.user.findMany({
    where: {
      gatc_id: gatcId,
      registrationRole: RoleType.GATC_OFFICER,
    },
    orderBy: {
      fullName: "asc",
    },
    select: {
      user_id: true,
      name: true,
      fullName: true,
      email: true,
      mobile: true,
      employeeId: true,
      isActive: true,
      emailVerified: true,
      mobileVerified: true,
      registrationRole: true,
    },
  });
};

export const findGatcOfficerApplicationsRepository = async (
  gatcId: string,
  officerIds: string[],
) => {
  if (officerIds.length === 0) {
    return [];
  }

  return prisma.verificationApp.findMany({
    where: {
      assigned_gatc_id: gatcId,
      assigned_officer_id: {
        in: officerIds,
      },
    },
    select: {
      app_id: true,
      application_no: true,
      assigned_officer_id: true,
      workflow_status: true,
      submission_timestamp: true,
      instrument: {
        select: {
          serial_number: true,
          model_no: true,
          manufacturer_name: true,
          category: {
            select: {
              category_name: true,
              category_code: true,
            },
          },
        },
      },
    },
    orderBy: {
      submission_timestamp: "desc",
    },
  });
};

export const findSuccessfulGatcReceiptsRepository = async (gatcId: string) => {
  return prisma.paymentReceipt.findMany({
    where: {
      payment_status: PaymentStatus.SUCCESS,
      application: {
        assigned_gatc_id: gatcId,
      },
    },
    select: {
      receipt_id: true,
      receipt_no: true,
      transaction_id: true,
      transaction_date: true,
      gatc_share: true,
      total_amount: true,
      govt_share: true,
      application: {
        select: {
          app_id: true,
          application_no: true,
        },
      },
    },
    orderBy: {
      transaction_date: "asc",
    },
  });
};

export const findExistingUserByEmailRepository = async (email: string) => {
  return prisma.user.findUnique({
    where: {
      email,
    },
    select: {
      user_id: true,
    },
  });
};

export const findExistingUserByMobileRepository = async (mobile: string) => {
  return prisma.user.findUnique({
    where: {
      mobile,
    },
    select: {
      user_id: true,
    },
  });
};

export const findExistingOfficerByEmployeeIdRepository = async (
  employeeId: string,
) => {
  return prisma.user.findFirst({
    where: {
      employeeId,
      registrationRole: RoleType.GATC_OFFICER,
    },
    select: {
      user_id: true,
    },
  });
};

export const createGatcOfficerRepository = async ({
  principalUserId,
  gatcId,
  fullName,
  email,
  mobile,
  employeeId,
  passwordHash,
  jurisdictionDistrict,
  jurisdictionState,
}: {
  principalUserId: string;
  gatcId: string;
  fullName: string;
  email: string;
  mobile: string;
  employeeId: string;
  passwordHash: string;
  jurisdictionDistrict: string;
  jurisdictionState: string;
}) => {
  return prisma.$transaction(async (tx) => {
    const officer = await tx.user.create({
      data: {
        name: fullName,
        fullName,
        email,
        mobile,
        employeeId,
        passwordHash,
        jurisdiction_district_id: jurisdictionDistrict,
        jurisdiction_state: jurisdictionState,
        gatc_id: gatcId,
        registrationRole: RoleType.GATC_OFFICER,
        isActive: true,
        emailVerified: false,
        mobileVerified: false,
      },
      select: {
        user_id: true,
        name: true,
        fullName: true,
        email: true,
        mobile: true,
        employeeId: true,
        registrationRole: true,
        isActive: true,
      },
    });

    await tx.registrationApplication.create({
      data: {
        userId: officer.user_id,
        role: RoleType.GATC_OFFICER,
        status: ApplicationStatus.APPROVED,
        reviewedBy: principalUserId,
      },
    });

    return officer;
  });
};

export const findPrincipalSettingsRepository = async (userId: string) => {
  return prisma.user.findUnique({
    where: {
      user_id: userId,
    },
    select: {
      user_id: true,
      name: true,
      fullName: true,
      email: true,
      mobile: true,
      emailVerified: true,
      mobileVerified: true,
      registrationRole: true,
      gatc_centres: {
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
      },
    },
  });
};
