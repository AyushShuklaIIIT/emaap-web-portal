import { prisma } from "../lib/prisma";

export interface GetFeeRulesParams {
  page: number;
  limit: number;
  search?: string;
}

export interface GetInstrumentCategoriesParams {
  page: number;
  limit: number;
  search?: string;
  filter?: "ALL" | "GATC";
}

export interface InstrumentCategoryRepositoryInput {
  category_code: string;
  category_name: string;
  accuracy_class:
    | "CLASS_I"
    | "CLASS_II"
    | "CLASS_III"
    | "CLASS_IIII"
    | "CLASS_M1"
    | "CLASS_XIII"
    | "CLASS_0_5";
  oiml_standard_ref: string;
  verification_cycle_months: number;
  isApprovedForGatc?: boolean;
}

export interface CreateFeeRuleRepositoryInput {
  state_id: string;
  category_id: string;
  min_value: string | null;
  max_value: string | null;
  unit: string;
  fee_amount: string;
  fee_basis: "PER_PIECE" | "PER_METRE" | "PER_LITRE" | "FIXED";
  condition: string | null;
  additional_fee: string | null;
  additional_unit: string | null;
  maximum_fee: string | null;
}

export type UpdateFeeRuleRepositoryInput = CreateFeeRuleRepositoryInput;

export const getFeeRulesRepository = async ({
  page,
  limit,
  search,
}: GetFeeRulesParams) => {
  const skip = (page - 1) * limit;

  const normalizedSearch = search?.trim();

  const where = normalizedSearch
    ? {
        OR: [
          {
            category: {
              category_code: {
                contains: normalizedSearch,
                mode: "insensitive" as const,
              },
            },
          },
          {
            category: {
              category_name: {
                contains: normalizedSearch,
                mode: "insensitive" as const,
              },
            },
          },
          {
            state: {
              state_code: {
                contains: normalizedSearch,
                mode: "insensitive" as const,
              },
            },
          },
          {
            state: {
              state_name: {
                contains: normalizedSearch,
                mode: "insensitive" as const,
              },
            },
          },
          {
            condition: {
              contains: normalizedSearch,
              mode: "insensitive" as const,
            },
          },
          {
            unit: {
              contains: normalizedSearch,
              mode: "insensitive" as const,
            },
          },
        ],
      }
    : undefined;

  const [feeRules, total] = await prisma.$transaction([
    prisma.feeRule.findMany({
      where,
      include: {
        category: true,
        state: true,
      },
      orderBy: [
        {
          category: {
            category_code: "asc",
          },
        },
        {
          min_value: "asc",
        },
      ],
      skip,
      take: limit,
    }),
    prisma.feeRule.count({
      where,
    }),
  ]);

  return {
    feeRules,
    total,
  };
};

export const getStatesRepository = async () => {
  return prisma.state.findMany({
    select: {
      state_id: true,
      state_code: true,
      state_name: true,
    },
    orderBy: {
      state_name: "asc",
    },
  });
};

export const getInstrumentCategoryOptionsRepository = async () => {
  return prisma.instrumentCategory.findMany({
    select: {
      category_id: true,
      category_code: true,
      category_name: true,
    },
    orderBy: {
      category_name: "asc",
    },
  });
};

export const getInstrumentCategoriesRepository = async ({
  page,
  limit,
  search,
  filter = "ALL",
}: GetInstrumentCategoriesParams) => {
  const skip = (page - 1) * limit;

  const normalizedSearch = search?.trim();

  const conditions = [];

  if (normalizedSearch) {
    conditions.push({
      OR: [
        {
          category_code: {
            contains: normalizedSearch,
            mode: "insensitive" as const,
          },
        },
        {
          category_name: {
            contains: normalizedSearch,
            mode: "insensitive" as const,
          },
        },
      ],
    });
  }

  if (filter === "GATC") {
    conditions.push({
      isApprovedForGatc: true,
    });
  }

  const where =
    conditions.length === 0
      ? undefined
      : conditions.length === 1
        ? conditions[0]
        : { AND: conditions };

  const [categories, total] = await prisma.$transaction([
    prisma.instrumentCategory.findMany({
      where,
      select: {
        category_id: true,
        category_code: true,
        category_name: true,
        accuracy_class: true,
        oiml_standard_ref: true,
        verification_cycle_months: true,
        isApprovedForGatc: true,
      },
      orderBy: {
        category_code: "asc",
      },
      skip,
      take: limit,
    }),

    prisma.instrumentCategory.count({
      where,
    }),
  ]);

  return {
    categories,
    total,
  };
};

export const createInstrumentCategoryRepository = async (
  data: InstrumentCategoryRepositoryInput,
) => {
  return prisma.instrumentCategory.create({
    data: {
      ...data,
      isApprovedForGatc: data.isApprovedForGatc ?? false,
    },
  });
};

export const updateInstrumentCategoryRepository = async (
  id: string,
  data: InstrumentCategoryRepositoryInput,
) => {
  return prisma.instrumentCategory.update({
    where: {
      category_id: id,
    },
    data,
  });
};

export const createFeeRuleRepository = async (
  data: CreateFeeRuleRepositoryInput,
) => {
  return prisma.feeRule.create({
    data: {
      state_id: data.state_id,
      category_id: data.category_id,
      min_value: data.min_value,
      max_value: data.max_value,
      unit: data.unit,
      fee_amount: data.fee_amount,
      fee_basis: data.fee_basis,
      condition: data.condition,
      additional_fee: data.additional_fee,
      additional_unit: data.additional_unit,
      maximum_fee: data.maximum_fee,
    },
    include: {
      category: true,
      state: true,
    },
  });
};

export const updateFeeRuleRepository = async (
  id: string,
  data: UpdateFeeRuleRepositoryInput,
) => {
  return prisma.feeRule.update({
    where: {
      fee_rule_id: id,
    },
    data: {
      state_id: data.state_id,
      category_id: data.category_id,
      min_value: data.min_value,
      max_value: data.max_value,
      unit: data.unit,
      fee_amount: data.fee_amount,
      fee_basis: data.fee_basis,
      condition: data.condition,
      additional_fee: data.additional_fee,
      additional_unit: data.additional_unit,
      maximum_fee: data.maximum_fee,
    },
    include: {
      category: true,
      state: true,
    },
  });
};
