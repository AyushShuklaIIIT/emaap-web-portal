import { AppError } from "../errors/AppError";
import {
  findBusinessByUserId,
  findUserByUserId,
} from "../repositories/dashboard.repository";
import {
  getInstrumentBySearch,
  getVerifiedInstrumentsByUserId,
} from "../repositories/instrument.repository";
import { Instrument } from "../types";

export const getVerifiedInstrumentsService = async (
  userId: string,
): Promise<Instrument[]> => {
  const user = await findUserByUserId(userId);
  if (!user) throw new AppError(404, "User not found");

  const business = await findBusinessByUserId(userId);
  if (!business) throw new AppError(404, "Business not found");

  const instruments = await getVerifiedInstrumentsByUserId(
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
  if (!business) throw new AppError(404, "Business not found");

  const instruments = await getInstrumentBySearch(business.business_id, input);

  if (!instruments) {
    throw new AppError(404, "Business not found");
  }

  return instruments;
};
