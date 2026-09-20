import {
  getApplicationsDashboard,
  getBusinessDashboard,
} from "@/services/business/dashboard.service";
import { useQuery } from "@tanstack/react-query";

export const useBusinessDashboard = (userId: string | undefined) => {
  const dashboardQuery = useQuery({
    queryKey: ["business-dashboard", userId],
    queryFn: () => getBusinessDashboard(userId as string),
    enabled: Boolean(userId),
  });

  const applicationsQuery = useQuery({
    queryKey: ["business-applications", userId],
    queryFn: () => getApplicationsDashboard(userId as string),
    enabled: Boolean(userId),
  });

  return {
    dashboard: dashboardQuery.data,
    applications: applicationsQuery.data ?? [],
    isLoading: dashboardQuery.isLoading || applicationsQuery.isLoading,
    isError: dashboardQuery.isError || applicationsQuery.isError,
    error: dashboardQuery.error ?? applicationsQuery.error,

    refetch: async () => {
      await Promise.all([
        dashboardQuery.refetch(),
        applicationsQuery.refetch(),
      ]);
    },
  };
};
