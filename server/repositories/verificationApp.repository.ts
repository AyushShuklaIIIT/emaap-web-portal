import { VerificationAppData, VerificationForm } from "../types";
import { prisma } from "../lib/prisma";

export const getAllVerificationsByBusinessId = async (
  businessId: string,
): Promise<VerificationAppData[]> => {
  const applications = await prisma.verificationApp.findMany({
    where: { business_id: businessId },
  });

  return applications;
};

export const postVerificationAppByBusinessId = async (
  businessId: string,
  instrumentId: string,
  data: VerificationForm,
): Promise<VerificationAppData> => {
  const application = await prisma.verificationApp.create({
    data: {
      application_no: data.applicationId,
      app_type: "RE_VERIFICATION",
      workflow_status: "SUBMITTED",
      instrument_id: instrumentId,
      business_id: businessId,
    },
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

  return application;
};

export const findActiveVerificationAppByInstrumentId = async (
  businessId: string,
  instrumentId: string,
): Promise<VerificationAppData | null> => {
  const application = await prisma.verificationApp.findFirst({
    where: {
      business_id: businessId,
      instrument_id: instrumentId,
      workflow_status: {
        in: ["SUBMITTED", "ALLOCATED"],
      },
    },
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

  return application;
};
