import { VerificationAppData, VerificationForm } from "../types";
import { prisma } from "../lib/prisma";

export const getAllVerificationsByBusinessId = async (
  businessId: string,
): Promise<VerificationAppData[]> => {
  const applications = await prisma.verificationApp.findMany({
    where: { business_id: businessId },
    include: {
      receipts: true,
      inspections: true,
      instrument: true,
      business: true,
      assigned_officer: true,
      assigned_gatc: true,
    },
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
    include: {
      receipts: true,
      inspections: true,
      instrument: true,
      business: true,
      assigned_officer: true,
      assigned_gatc: true,
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
    include: {
      receipts: true,
      inspections: true,
      instrument: true,
      business: true,
      assigned_officer: true,
      assigned_gatc: true,
    },
  });

  return application;
};
