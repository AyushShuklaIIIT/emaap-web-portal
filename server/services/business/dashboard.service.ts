import { AppError } from "../../errors/AppError";
import {
  findUserByUserId,
  findBusinessByUserId,
  getDashboardDetails,
  getApplicationsByUserId,
} from "../../repositories/dashboard.repository";
import { VerificationCertificateApp } from "../../types";

export const getBusinessDashboardService = async (
  userId: string,
): Promise<{
  active_instruments: number;
  expires_in: number;
  pending: number;
}> => {
  const user = await findUserByUserId(userId);
  if (!user) throw new AppError(404, "User Not Found");

  const business = await findBusinessByUserId(userId);
  if (!business) throw new AppError(404, "User Business Not Found");

  const details = await getDashboardDetails(userId);

  return details;
};

export const getApplicationsDashboardService = async (
  userId: string,
): Promise<VerificationCertificateApp[]> => {
  const user = await findUserByUserId(userId);
  if (!user) throw new AppError(404, "User Not Found");

  const business = await findBusinessByUserId(userId);
  if (!business) throw new AppError(404, "User Business Not Found");

  const applications = await getApplicationsByUserId(userId);

  return applications;
};
