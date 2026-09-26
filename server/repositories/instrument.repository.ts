import { Certificate, Instrument } from "../types";
import { prisma } from "../lib/prisma";
import { findBusinessByUserId } from "./dashboard.repository";

export const getVerifiedInstrumentsByBusinessId = async (
  businessId: string,
) => {
  return prisma.measuringInstrument.findMany({
    where: {
      business_id: businessId,
      status: "VERIFIED",
    },
    include: {
      category: true,
      certificates: true,
    },
  });
};
export const getInstrumentBySearch = async (
  business_id: string,
  search: string,
): Promise<Instrument[] | null> => {
  const instruments = await prisma.measuringInstrument.findMany({
    where: {
      business_id: business_id,
      status: "VERIFIED",

      ...(search
        ? {
            OR: [
              {
                serial_number: {
                  contains: search,
                  mode: "insensitive",
                },
              },
              {
                category: {
                  category_name: {
                    contains: search,
                    mode: "insensitive",
                  },
                },
              },
              {
                category: {
                  category_code: {
                    contains: search,
                    mode: "insensitive",
                  },
                },
              },
            ],
          }
        : {}),
    },

    include: {
      certificates: true,
      category: true,
    },
  });

  return instruments;
};

export const findVerifiedInstrumentForBusiness = async (
  businessId: string,
  serialNumber: string,
  categoryName: string,
) => {
  return prisma.measuringInstrument.findFirst({
    where: {
      business_id: businessId,
      serial_number: serialNumber,
      status: "VERIFIED",
      category: {
        category_name: categoryName,
      },
    },
    select: {
      instrument_id: true,
      serial_number: true,
      business_id: true,
      category_id: true,
      model_approval_no: true,
      manufacturer_name: true,
      status: true,
      category: {
        select: {
          category_id: true,
          category_name: true,
          accuracy_class: true,
        },
      },
    },
  });
};

export const getInstrumentHistoryByApplicationId = async (
  applicationId: string,
) => {
  return prisma.measuringInstrument.findFirst({
    where: {
      applications: {
        some: {
          OR: [
            { app_id: applicationId },
            { application_no: applicationId }
          ]
        },
      },
    },
    select: {
      applications: {
        orderBy: {
          submission_timestamp: "desc",
        },
        select: {
          inspections: {
            select: {
              seals: {
                select: {
                  s3_photo_url: true,
                },
              },
            },
          },
        },
      },
    },
  });
};
