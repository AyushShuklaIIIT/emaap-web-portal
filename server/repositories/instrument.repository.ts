import { Certificate, Instrument } from "../types";
import { prisma } from "../lib/prisma";
import { findBusinessByUserId } from "./dashboard.repository";

export const getVerifiedInstrumentsByUserId = async (
  business_id: string,
): Promise<Instrument[] | null> => {
  const instruments = await prisma.measuringInstrument.findMany({
    where: {
      business_id: business_id,
      status: "VERIFIED",
    },
    include: {
      certificates: true,
    },
  });

  return instruments;
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
