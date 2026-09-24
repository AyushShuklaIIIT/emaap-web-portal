import {
  getStateAdminDashboard,
  getStateAdminAllocations,
  getStateAdminGatcs,
} from "@/services/admin/state/stateAdminDashboard.service";
import { useQuery } from "@tanstack/react-query";

export const useStateAdminDashboard = (financialYear: string) => {
  const query = useQuery({
    queryKey: ["state-admin-dashboard", financialYear],
    queryFn: () => getStateAdminDashboard(financialYear),
    enabled: Boolean(financialYear),
    staleTime: 30_000,
  });

  return {
    data: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
};

export const useStateAdminAllocations = () => {
  const query = useQuery({
    queryKey: ["state-admin-allocations"],
    queryFn: getStateAdminAllocations,
    staleTime: 30_000,
  });

  return {
    allocations: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
};

export const useStateAdminGatcs = (district?: string) => {
  const query = useQuery({
    queryKey: ["state-admin-gatcs", district],
    queryFn: () => getStateAdminGatcs(district),
    staleTime: 30_000,
  });

  return {
    gatcs: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
};
