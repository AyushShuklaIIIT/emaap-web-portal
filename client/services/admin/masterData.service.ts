import { api } from "@/lib/api";

export type FeeBasis = "PER_PIECE" | "PER_METRE" | "PER_LITRE" | "FIXED";

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

  feeBasis: FeeBasis;

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

export interface FeeSchedulePayload {
  state_id: string;
  category_id: string;
  min_value: string | null;
  max_value: string | null;
  unit: string;
  fee_amount: string;
  fee_basis: FeeBasis;
  condition: string | null;
  additional_fee: string | null;
  additional_unit: string | null;
  maximum_fee: string | null;
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

export type InstrumentAccuracyClass =
  | "CLASS_I"
  | "CLASS_II"
  | "CLASS_III"
  | "CLASS_IIII"
  | "CLASS_M1"
  | "CLASS_XIII"
  | "CLASS_0_5";

export interface InstrumentCategoryPayload {
  category_code: string;
  category_name: string;
  accuracy_class: InstrumentAccuracyClass;
  oiml_standard_ref: string;
  verification_cycle_months: number;
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

export interface FeeSchedulesResponse {
  success: boolean;
  data: FeeSchedule[];
  pagination: Pagination;
}

export interface InstrumentCategoriesResponse {
  success: boolean;
  data: InstrumentCategory[];
  pagination: Pagination;
}

export interface MasterDataOptionsResponse {
  success: boolean;
  data: MasterDataOption[];
}

export interface FetchFeeSchedulesParams {
  page: number;
  limit: number;
  search?: string;
}

export interface FetchInstrumentCategoriesParams {
  page: number;
  limit: number;
  search?: string;
  filter?: "ALL" | "GATC";
}

export const fetchFeeSchedules = async ({
  page,
  limit,
  search,
}: FetchFeeSchedulesParams): Promise<FeeSchedulesResponse> => {
  const response = await api.get<FeeSchedulesResponse>(
    "/admin/master-data/fee-schedules",
    {
      params: {
        page,
        limit,
        ...(search?.trim()
          ? {
              search: search.trim(),
            }
          : {}),
      },
    },
  );

  return response.data;
};

export const fetchInstrumentCategories = async ({
  page,
  limit,
  search,
  filter = "ALL",
}: FetchInstrumentCategoriesParams): Promise<InstrumentCategoriesResponse> => {
  const response = await api.get<InstrumentCategoriesResponse>(
    "/admin/master-data/instrument-categories",
    {
      params: {
        page,
        limit,
        ...(search?.trim()
          ? {
              search: search.trim(),
            }
          : {}),
        filter,
      },
    },
  );

  return response.data;
};

export const fetchInstrumentCategoryOptions = async (): Promise<
  MasterDataOption[]
> => {
  const response = await api.get<MasterDataOptionsResponse>(
    "/admin/master-data/instrument-categories/options",
  );

  return response.data.data;
};

export const fetchStates = async (): Promise<MasterDataOption[]> => {
  const response = await api.get<MasterDataOptionsResponse>(
    "/admin/master-data/states",
  );

  return response.data.data;
};

export const createFeeSchedule = async (
  data: FeeSchedulePayload,
): Promise<FeeSchedule> => {
  const response = await api.post<{
    success: boolean;
    data: FeeSchedule;
  }>("/admin/master-data/fee-schedules", data);

  return response.data.data;
};

export const updateFeeSchedule = async (
  id: string,
  data: FeeSchedulePayload,
): Promise<FeeSchedule> => {
  const response = await api.put<{
    success: boolean;
    data: FeeSchedule;
  }>(`/admin/master-data/fee-schedules/${id}`, data);

  return response.data.data;
};

export const createInstrumentCategory = async (
  data: InstrumentCategoryPayload,
): Promise<InstrumentCategory> => {
  const response = await api.post<{
    success: boolean;
    data: InstrumentCategory;
  }>("/admin/master-data/instrument-categories", data);

  return response.data.data;
};

export const updateInstrumentCategory = async (
  id: string,
  data: InstrumentCategoryPayload,
): Promise<InstrumentCategory> => {
  const response = await api.put<{
    success: boolean;
    data: InstrumentCategory;
  }>(`/admin/master-data/instrument-categories/${id}`, data);

  return response.data.data;
};
