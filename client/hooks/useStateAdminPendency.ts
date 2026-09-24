import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  ApprovalRoutePayload,
  ManualOverridePayload,
} from "@/services/admin/pendency.service";
import {
  StatePendencyFilters,
  getStatePendencyQueue,
  approveStatePendencyRoute,
  manualOverrideStatePendency,
  bulkApproveStatePendencyRoutes,
} from "@/services/admin/state/stateAdminPendency.service";

export const useStateAdminPendencyQueue = (filters: StatePendencyFilters) => {
  return useQuery({
    queryKey: [
      "state-admin-pendency",
      filters.district ?? "ALL",
      filters.slaStatus ?? "ALL",
      filters.page ?? 1,
      filters.limit ?? 20,
    ],
    queryFn: () => getStatePendencyQueue(filters),
    placeholderData: (previousData) => previousData,
  });
};

export const useApproveStatePendencyRoute = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      appId,
      route,
    }: {
      appId: string;
      route: ApprovalRoutePayload;
    }) => approveStatePendencyRoute(appId, route),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["state-admin-pendency"] });
      queryClient.invalidateQueries({ queryKey: ["state-admin-dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["state-admin-allocations"] });
    },
  });
};

export const useManualOverrideStatePendency = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      appId,
      payload,
    }: {
      appId: string;
      payload: ManualOverridePayload;
    }) => manualOverrideStatePendency(appId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["state-admin-pendency"] });
      queryClient.invalidateQueries({ queryKey: ["state-admin-dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["state-admin-allocations"] });
    },
  });
};

export const useBulkApproveStatePendencyRoutes = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (appIds: string[]) => bulkApproveStatePendencyRoutes(appIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["state-admin-pendency"] });
      queryClient.invalidateQueries({ queryKey: ["state-admin-dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["state-admin-allocations"] });
    },
  });
};
