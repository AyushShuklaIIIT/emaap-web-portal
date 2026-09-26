import { useState } from "react";
import {
  getApplicationsDashboard,
  getBusinessDashboard,
} from "@/services/business/dashboard.service";
import { useQuery } from "@tanstack/react-query";

export const useBusinessDashboard = (userId: string | undefined) => {
  const [page, setPage] = useState(1);
  const limit = 5;

  const dashboardQuery = useQuery({
    queryKey: ["business-dashboard", userId],
    queryFn: () => getBusinessDashboard(userId as string),
    enabled: Boolean(userId),
  });

  const applicationsQuery = useQuery({
    queryKey: ["business-applications", userId, page],
    queryFn: () => getApplicationsDashboard(userId as string, page, limit),
    enabled: Boolean(userId),
  });

  return {
    dashboard: dashboardQuery.data,
    applications: applicationsQuery.data?.data ?? [],
    pagination: applicationsQuery.data?.pagination,
    page,
    setPage,
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
