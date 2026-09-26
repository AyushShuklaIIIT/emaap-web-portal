import { AppError } from "../../errors/AppError";
import {
  findBusinessByUserId,
  findUserByUserId,
} from "../../repositories/dashboard.repository";
import {
  getInstrumentBySearch,
  getVerifiedInstrumentsByBusinessId,
} from "../../repositories/instrument.repository";
import { Instrument } from "../../types";

export const getVerifiedInstrumentsService = async (
  userId: string,
): Promise<Instrument[]> => {
  const user = await findUserByUserId(userId);
  if (!user) throw new AppError(404, "User not found");

  const business = await findBusinessByUserId(userId);
  if (!business) return [];

  const instruments = await getVerifiedInstrumentsByBusinessId(
    business.business_id,
  );

  return instruments;
};

export const getInstrumentSearchService = async (
  userId: string,
  input: string,
): Promise<Instrument[]> => {
  const user = await findUserByUserId(userId);
  if (!user) throw new AppError(404, "User not found");

  const business = await findBusinessByUserId(userId);
  if (!business) return [];

  const instruments = await getInstrumentBySearch(business.business_id, input);

  if (!instruments) {
    return [];
  }

  return instruments;
};
export const getInstrumentHistoryService = async (
  applicationId: string,
) => {
  const { getInstrumentHistoryByApplicationId } = await import("../../repositories/instrument.repository");
  const history = await getInstrumentHistoryByApplicationId(applicationId);
  if (!history) throw new AppError(404, "Instrument history not found for the given application");
  return history;
};
