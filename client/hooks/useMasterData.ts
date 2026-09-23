import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  createFeeSchedule,
  createInstrumentCategory,
  fetchFeeSchedules,
  fetchInstrumentCategories,
  fetchInstrumentCategoryOptions,
  fetchStates,
  updateFeeSchedule,
  updateInstrumentCategory,
  type FeeSchedulePayload,
  type InstrumentCategoryPayload,
} from "@/services/admin/masterData.service";

export const useFeeSchedules = (
  page: number,
  limit: number,
  search: string,
) => {
  return useQuery({
    queryKey: ["feeSchedules", page, limit, search],

    queryFn: () =>
      fetchFeeSchedules({
        page,
        limit,
        search,
      }),

    staleTime: 5 * 60 * 1000,

    placeholderData: (previousData) => previousData,
  });
};

export const useInstrumentCategories = (
  page: number,
  limit: number,
  search: string,
  filter: "ALL" | "GATC",
) => {
  return useQuery({
    queryKey: ["instrumentCategories", page, limit, search, filter],

    queryFn: () =>
      fetchInstrumentCategories({
        page,
        limit,
        search,
        filter,
      }),

    staleTime: 5 * 60 * 1000,

    placeholderData: (previousData) => previousData,
  });
};

export const useInstrumentCategoryOptions = () => {
  return useQuery({
    queryKey: ["instrumentCategoryOptions"],

    queryFn: fetchInstrumentCategoryOptions,

    staleTime: 30 * 60 * 1000,
  });
};

export const useStates = () => {
  return useQuery({
    queryKey: ["masterData", "states"],

    queryFn: fetchStates,

    staleTime: 30 * 60 * 1000,
  });
};

export const useCreateFeeSchedule = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: FeeSchedulePayload) => createFeeSchedule(data),

    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["feeSchedules"],
      });
    },
  });
};

export const useUpdateFeeSchedule = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: FeeSchedulePayload }) =>
      updateFeeSchedule(id, data),

    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["feeSchedules"],
      });
    },
  });
};

export const useCreateInstrumentCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: InstrumentCategoryPayload) =>
      createInstrumentCategory(data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["instrumentCategories"],
      });
      await queryClient.invalidateQueries({
        queryKey: ["instrumentCategoryOptions"],
      });
    },
  });
};

export const useUpdateInstrumentCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: InstrumentCategoryPayload;
    }) => updateInstrumentCategory(id, data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["instrumentCategories"],
      });
      await queryClient.invalidateQueries({
        queryKey: ["instrumentCategoryOptions"],
      });
    },
  });
};
