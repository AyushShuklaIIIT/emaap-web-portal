import { AppError } from "../../errors/AppError";
import { getCertificatesByBusinessId } from "../../repositories/certificate.repository";

import {
  findUserByUserId,
  findBusinessByUserId,
} from "../../repositories/dashboard.repository";

export const getCertificatesService = async (userId: string) => {
  const user = await findUserByUserId(userId);

  if (!user) {
    throw new AppError(404, "User not found");
  }

  const business = await findBusinessByUserId(userId);

  if (!business) {
    throw new AppError(404, "Business profile not found");
  }

  const certificates = await getCertificatesByBusinessId(business.business_id);

  return certificates;
};
