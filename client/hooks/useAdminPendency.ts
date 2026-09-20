import {
  PendencyFilters,
  getPendencyQueue,
  approvePendencyRoute,
  ManualOverridePayload,
  manualOverridePendency,
  bulkApprovePendencyRoutes,
} from "@/services/admin/pendency.service";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export const usePendencyQueue = (filters: PendencyFilters) => {
  return useQuery({
    queryKey: [
      "admin-pendency",
      filters.stateCode ?? "ALL",
      filters.slaStatus ?? "ALL",
      filters.page ?? 1,
      filters.limit ?? 20,
    ],

    queryFn: () => getPendencyQueue(filters),

    placeholderData: (previousData) => previousData,
  });
};

export const useApprovePendencyRoute = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (appId: string) => approvePendencyRoute(appId),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["admin-pendency"],
      });

      queryClient.invalidateQueries({
        queryKey: ["admin-dashboard"],
      });

      queryClient.invalidateQueries({
        queryKey: ["admin-allocations"],
      });
    },
  });
};

export const useManualOverridePendency = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      appId,
      payload,
    }: {
      appId: string;
      payload: ManualOverridePayload;
    }) => manualOverridePendency(appId, payload),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["admin-pendency"],
      });

      queryClient.invalidateQueries({
        queryKey: ["admin-dashboard"],
      });

      queryClient.invalidateQueries({
        queryKey: ["admin-allocations"],
      });
    },
  });
};

export const useBulkApprovePendencyRoutes = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (appIds: string[]) => bulkApprovePendencyRoutes(appIds),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["admin-pendency"],
      });

      queryClient.invalidateQueries({
        queryKey: ["admin-dashboard"],
      });

      queryClient.invalidateQueries({
        queryKey: ["admin-allocations"],
      });
    },
  });
};
