import { randomBytes, scryptSync } from "node:crypto";

import { RoleType, WorkflowStatus } from "../../generated/prisma/enums.js";
import {
  findPrincipalGatcRepository,
  findGatcOfficersRepository,
  findGatcOfficerApplicationsRepository,
  findSuccessfulGatcReceiptsRepository,
  findExistingUserByEmailRepository,
  findExistingUserByMobileRepository,
  findExistingOfficerByEmployeeIdRepository,
  createGatcOfficerRepository,
  findPrincipalSettingsRepository,
} from "../../repositories/gatcPage.repository.js";

export class GatcServiceError extends Error {
  statusCode: number;

  constructor(message: string, statusCode = 400) {
    super(message);
    this.name = "GatcServiceError";
    this.statusCode = statusCode;
  }
}

const hashPassword = (password: string) => {
  return `mock-salt:${scryptSync(password, "mock-salt", 64).toString("hex")}`;
};

const generateTemporaryPassword = () => {
  return randomBytes(6).toString("base64url");
};

const normalize = (value: string) => value.trim();

const getPrincipalContext = async (userId: string) => {
  const principal = await findPrincipalGatcRepository(userId);

  if (!principal) {
    throw new GatcServiceError("User not found", 404);
  }

  if (principal.registrationRole !== RoleType.GATC_PRINCIPAL) {
    throw new GatcServiceError(
      "Only a GATC Principal Officer can access this resource",
      403,
    );
  }

  if (!principal.gatc_centres) {
    throw new GatcServiceError(
      "No GATC centre is associated with this principal",
      404,
    );
  }

  return principal;
};

export const getGatcDashboardService = async (userId: string) => {
  const principal = await getPrincipalContext(userId);
  const gatc = principal.gatc_centres;

  const officers = await findGatcOfficersRepository(gatc.gatc_id);

  const officerIds = officers.map((officer) => officer.user_id);

  const applications = await findGatcOfficerApplicationsRepository(
    gatc.gatc_id,
    officerIds,
  );

  const activeAssignments = new Set(
    applications
      .filter(
        (application) =>
          application.workflow_status === WorkflowStatus.ALLOCATED,
      )
      .map((application) => application.assigned_officer_id)
      .filter((id): id is string => Boolean(id)),
  );

  const officerSummaries = officers.map((officer) => ({
    user_id: officer.user_id,
    full_name: officer.fullName,
    name: officer.name,
    email: officer.email,
    mobile: officer.mobile,
    employee_id: officer.employeeId,
    is_active: officer.isActive,
    email_verified: officer.emailVerified,
    mobile_verified: officer.mobileVerified,
    status: activeAssignments.has(officer.user_id)
      ? ("ASSIGNED" as const)
      : ("FREE" as const),
  }));

  const assignedOfficerIds = new Set(
    officerSummaries
      .filter((officer) => officer.status === "ASSIGNED")
      .map((officer) => officer.user_id),
  );

  const receipts = await findSuccessfulGatcReceiptsRepository(gatc.gatc_id);

  let totalRevenue = 0;

  const revenueMap = new Map<string, number>();

  for (const receipt of receipts) {
    totalRevenue += receipt.gatc_share;

    if (!receipt.transaction_date) {
      continue;
    }

    const date = receipt.transaction_date.toISOString().slice(0, 10);

    revenueMap.set(date, (revenueMap.get(date) ?? 0) + receipt.gatc_share);
  }

  const revenue = Array.from(revenueMap.entries()).map(([date, amount]) => ({
    date,
    revenue: Number(amount.toFixed(2)),
  }));

  return {
    principal: {
      user_id: principal.user_id,
      name: principal.name,
      full_name: principal.fullName,
      email: principal.email,
      mobile: principal.mobile,
      email_verified: principal.emailVerified,
      mobile_verified: principal.mobileVerified,
    },

    gatc: {
      gatc_id: gatc.gatc_id,
      centre_code: gatc.centre_code,
      approval_cert_no: gatc.approval_cert_no,
      ind_mark_code: gatc.ind_mark_code,
      valid_from: gatc.valid_from.toISOString(),
      valid_to: gatc.valid_to.toISOString(),
      status: gatc.status,
      approved_categories: gatc.approved_categories,
    },

    metrics: {
      total_officers: officers.length,
      assigned_officers: assignedOfficerIds.size,
      free_officers: officers.length - assignedOfficerIds.size,
      total_revenue: Number(totalRevenue.toFixed(2)),
    },

    revenue,

    officers: officerSummaries,
  };
};

export const registerGatcOfficerService = async ({
  principalUserId,
  fullName,
  email,
  mobile,
  employeeId,
}: {
  principalUserId: string;
  fullName: string;
  email: string;
  mobile: string;
  employeeId: string;
}) => {
  const principal = await getPrincipalContext(principalUserId);

  const normalizedFullName = normalize(fullName);
  const normalizedEmail = normalize(email).toLowerCase();
  const normalizedMobile = normalize(mobile);
  const normalizedEmployeeId = normalize(employeeId);

  if (normalizedFullName.length < 2) {
    throw new GatcServiceError("Full name is required");
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    throw new GatcServiceError("Enter a valid email address");
  }

  if (!/^\d{10}$/.test(normalizedMobile)) {
    throw new GatcServiceError("Mobile number must contain exactly 10 digits");
  }

  if (!normalizedEmployeeId) {
    throw new GatcServiceError("Employee ID is required");
  }

  const [existingEmail, existingMobile, existingEmployee] = await Promise.all([
    findExistingUserByEmailRepository(normalizedEmail),
    findExistingUserByMobileRepository(normalizedMobile),
    findExistingOfficerByEmployeeIdRepository(normalizedEmployeeId),
  ]);

  if (existingEmail) {
    throw new GatcServiceError("A user with this email already exists", 409);
  }

  if (existingMobile) {
    throw new GatcServiceError(
      "A user with this mobile number already exists",
      409,
    );
  }

  if (existingEmployee) {
    throw new GatcServiceError(
      "A GATC officer with this Employee ID already exists",
      409,
    );
  }

  const temporaryPassword = generateTemporaryPassword();

  const officer = await createGatcOfficerRepository({
    principalUserId,
    gatcId: principal.gatc_centres.gatc_id,
    fullName: normalizedFullName,
    email: normalizedEmail,
    mobile: normalizedMobile,
    employeeId: normalizedEmployeeId,
    passwordHash: hashPassword(temporaryPassword),
    jurisdictionDistrict: principal.jurisdiction_district.district_id,
    jurisdictionState: principal.jurisdiction_state,
  });

  return {
    officer,
    temporary_password: temporaryPassword,
  };
};

export const getGatcSettingsService = async (userId: string) => {
  const settings = await findPrincipalSettingsRepository(userId);

  if (!settings) {
    throw new GatcServiceError("User not found", 404);
  }

  if (settings.registrationRole !== RoleType.GATC_PRINCIPAL) {
    throw new GatcServiceError(
      "Only a GATC Principal Officer can access this resource",
      403,
    );
  }

  if (!settings.gatc_centres) {
    throw new GatcServiceError(
      "No GATC centre is associated with this principal",
      404,
    );
  }

  return {
    principal: {
      user_id: settings.user_id,
      name: settings.name,
      full_name: settings.fullName,
      email: settings.email,
      mobile: settings.mobile,
      email_verified: settings.emailVerified,
      mobile_verified: settings.mobileVerified,
    },
    gatc: {
      gatc_id: settings.gatc_centres.gatc_id,
      centre_code: settings.gatc_centres.centre_code,
      approval_cert_no: settings.gatc_centres.approval_cert_no,
      ind_mark_code: settings.gatc_centres.ind_mark_code,
      valid_from: settings.gatc_centres.valid_from.toISOString(),
      valid_to: settings.gatc_centres.valid_to.toISOString(),
      status: settings.gatc_centres.status,
      approved_categories: settings.gatc_centres.approved_categories,
    },
  };
};
