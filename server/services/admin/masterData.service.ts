import {
  createFeeRuleRepository,
  createInstrumentCategoryRepository,
  getFeeRulesRepository,
  getInstrumentCategoriesRepository,
  getInstrumentCategoryOptionsRepository,
  getStatesRepository,
  updateFeeRuleRepository,
  updateInstrumentCategoryRepository,
  type CreateFeeRuleRepositoryInput,
  type InstrumentCategoryRepositoryInput,
} from "../../repositories/masterData.repository";

export interface FeeSchedule {
  id: string;

  code: string;
  category: string;

  stateId: string;
  stateCode: string;
  stateName: string;

  categoryId: string;

  minValue: string | null;
  maxValue: string | null;
  unit: string;

  feeAmount: string;

  feeBasis: "PER_PIECE" | "PER_METRE" | "PER_LITRE" | "FIXED";

  condition: string | null;

  additionalFee: string | null;
  additionalUnit: string | null;
  maximumFee: string | null;

  specification: string;
  fee: string;

  split: string;
  status: string;
  statusNote: string;
  tone: "active" | "deprecated";
}

export interface InstrumentCategory {
  id: string;
  code: string;
  name: string;
  accuracyClass: string;
  oimlRef: string;
  cycleMonths: number;
  isApprovedGatc: boolean;
}

export interface MasterDataOption {
  id: string;
  code: string;
  name: string;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface FeeSchedulesResult {
  data: FeeSchedule[];
  pagination: Pagination;
}

export interface InstrumentCategoriesResult {
  data: InstrumentCategory[];
  pagination: Pagination;
}

const formatDecimal = (value: unknown): string | null => {
  if (value === null || value === undefined) {
    return null;
  }

  return String(value);
};

const formatValue = (value: unknown, unit: string): string => {
  const formattedValue = formatDecimal(value);

  if (!formattedValue) {
    return "";
  }

  return `${formattedValue} ${unit}`.trim();
};

const buildSpecification = (rule: {
  min_value: unknown;
  max_value: unknown;
  unit: string;
  condition: string | null;
}) => {
  if (rule.condition) {
    return rule.condition;
  }

  const min = formatValue(rule.min_value, rule.unit);

  const max = formatValue(rule.max_value, rule.unit);

  if (min && max) {
    return `${min} - ${max}`;
  }

  if (min) {
    return `Above ${min}`;
  }

  if (max) {
    return `Up to ${max}`;
  }

  return "Standard";
};

const formatFeeBasis = (
  feeBasis: "PER_PIECE" | "PER_METRE" | "PER_LITRE" | "FIXED",
) => {
  switch (feeBasis) {
    case "PER_PIECE":
      return "piece";

    case "PER_METRE":
      return "metre";

    case "PER_LITRE":
      return "litre";

    case "FIXED":
      return "fixed";

    default:
      return feeBasis;
  }
};

const buildFee = (rule: {
  fee_amount: unknown;
  fee_basis: "PER_PIECE" | "PER_METRE" | "PER_LITRE" | "FIXED";
  additional_fee: unknown;
  maximum_fee: unknown;
}) => {
  const feeAmount = formatDecimal(rule.fee_amount);

  let fee =
    rule.fee_basis === "FIXED"
      ? `₹${feeAmount}`
      : `₹${feeAmount} per ${formatFeeBasis(rule.fee_basis)}`;

  if (rule.additional_fee !== null && rule.additional_fee !== undefined) {
    fee += ` + ₹${formatDecimal(rule.additional_fee)} additional`;
  }

  if (rule.maximum_fee !== null && rule.maximum_fee !== undefined) {
    fee += ` (Max ₹${formatDecimal(rule.maximum_fee)})`;
  }

  return fee;
};

const mapFeeRuleToSchedule = (rule: any): FeeSchedule => ({
  id: rule.fee_rule_id,

  code: rule.category.category_code,

  category: rule.category.category_name,

  stateId: rule.state.state_id,

  stateCode: rule.state.state_code,

  stateName: rule.state.state_name,

  categoryId: rule.category.category_id,

  minValue: formatDecimal(rule.min_value),

  maxValue: formatDecimal(rule.max_value),

  unit: rule.unit,

  feeAmount: String(rule.fee_amount),

  feeBasis: rule.fee_basis,

  condition: rule.condition,

  additionalFee: formatDecimal(rule.additional_fee),

  additionalUnit: formatDecimal(rule.additional_unit),

  maximumFee: formatDecimal(rule.maximum_fee),

  specification: buildSpecification(rule),

  fee: buildFee(rule),

  split: "Standard",
  status: "Active",
  statusNote: "",
  tone: "active",
});

export const getFeeSchedulesService = async (
  page: number,
  limit: number,
  search?: string,
): Promise<FeeSchedulesResult> => {
  const { feeRules, total } = await getFeeRulesRepository({
    page,
    limit,
    search,
  });

  return {
    data: feeRules.map(mapFeeRuleToSchedule),

    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const getStatesService = async (): Promise<MasterDataOption[]> => {
  const states = await getStatesRepository();

  return states.map((state) => ({
    id: state.state_id,
    code: state.state_code,
    name: state.state_name,
  }));
};

export const getInstrumentCategoryOptionsService = async (): Promise<
  MasterDataOption[]
> => {
  const categories = await getInstrumentCategoryOptionsRepository();

  return categories.map((category) => ({
    id: category.category_id,
    code: category.category_code,
    name: category.category_name,
  }));
};

export const getInstrumentCategoriesService = async (
  page: number,
  limit: number,
  search?: string,
  filter: "ALL" | "GATC" = "ALL",
): Promise<InstrumentCategoriesResult> => {
  const { categories, total } = await getInstrumentCategoriesRepository({
    page,
    limit,
    search,
    filter,
  });

  return {
    data: categories.map((category) => ({
      id: category.category_id,

      code: category.category_code,

      name: category.category_name,

      accuracyClass: category.accuracy_class,

      oimlRef: category.oiml_standard_ref,

      cycleMonths: category.verification_cycle_months,

      isApprovedGatc: category.isApprovedForGatc,
    })),

    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const createFeeScheduleService = async (
  data: CreateFeeRuleRepositoryInput,
) => {
  const rule = await createFeeRuleRepository(data);

  return mapFeeRuleToSchedule(rule);
};

export const createInstrumentCategoryService = async (
  data: InstrumentCategoryRepositoryInput,
) => {
  const category = await createInstrumentCategoryRepository(data);

  return {
    id: category.category_id,
    code: category.category_code,
    name: category.category_name,
    accuracyClass: category.accuracy_class,
    oimlRef: category.oiml_standard_ref,
    cycleMonths: category.verification_cycle_months,
    isApprovedGatc: category.isApprovedForGatc,
  };
};

export const updateInstrumentCategoryService = async (
  id: string,
  data: InstrumentCategoryRepositoryInput,
) => {
  const category = await updateInstrumentCategoryRepository(id, data);

  return {
    id: category.category_id,
    code: category.category_code,
    name: category.category_name,
    accuracyClass: category.accuracy_class,
    oimlRef: category.oiml_standard_ref,
    cycleMonths: category.verification_cycle_months,
    isApprovedGatc: category.isApprovedForGatc,
  };
};

export const updateFeeScheduleService = async (
  id: string,
  data: CreateFeeRuleRepositoryInput,
) => {
  const rule = await updateFeeRuleRepository(id, data);

  return mapFeeRuleToSchedule(rule);
};
