import { AppError } from "../../errors/AppError";
import {
  findUserByUserId,
  findBusinessByUserId,
} from "../../repositories/dashboard.repository";
import { findVerifiedInstrumentForBusiness } from "../../repositories/instrument.repository";
import {
  getAllVerificationsByBusinessId,
  findActiveVerificationAppByInstrumentId,
  postVerificationAppByBusinessId,
} from "../../repositories/verificationApp.repository";
import { VerificationAppData, VerificationForm } from "../../types";

export const getVerificationAppService = async (
  userId: string,
): Promise<VerificationAppData[]> => {
  const user = await findUserByUserId(userId);
  if (!user) throw new AppError(404, "User not found");

  const business = await findBusinessByUserId(userId);
  if (!business) throw new AppError(404, "Business not found");

  const applications = await getAllVerificationsByBusinessId(
    business.business_id,
  );

  return applications;
};

export const postVerificationAppService = async (
  userId: string,
  data: VerificationForm,
): Promise<VerificationAppData> => {
  const user = await findUserByUserId(userId);

  if (!user) {
    throw new AppError(404, "User not found");
  }

  const business = await findBusinessByUserId(userId);

  if (!business) {
    throw new AppError(404, "Business not found");
  }

  const instrument = await findVerifiedInstrumentForBusiness(
    business.business_id,
    data.instrumentSerialNumber,
    data.instrumentSubCategory,
  );

  if (!instrument) {
    throw new AppError(404, "Verified instrument not found for this business");
  }

  const existingApplication = await findActiveVerificationAppByInstrumentId(
    business.business_id,
    instrument.instrument_id,
  );

  if (existingApplication) {
    throw new AppError(
      409,
      "A verification application already exists for this instrument",
    );
  }

  const application = await postVerificationAppByBusinessId(
    business.business_id,
    instrument.instrument_id,
    data,
  );

  return application;
};
