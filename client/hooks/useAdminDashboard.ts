import {
  getAdminDashboard,
  getAdminAllocations,
} from "@/services/admin/dashboard.service";
import { useQuery } from "@tanstack/react-query";

export const useAdminDashboard = (financialYear: string) => {
  const query = useQuery({
    queryKey: ["admin-dashboard", financialYear],
    queryFn: () => getAdminDashboard(financialYear),
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

export const useAdminAllocations = () => {
  const query = useQuery({
    queryKey: ["admin-allocations"],
    queryFn: getAdminAllocations,
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
