import { useState, useCallback, useEffect } from "react";
import { FinancialReportResponse } from "@/services/admin/financial.service";
import {
  StateAdminFinancialFilters,
  getStateFinancialReport,
  exportStateFinancialReport,
} from "@/services/admin/state/stateFinancial.service";

export const useStateAdminFinancial = () => {
  const [filters, setFilters] = useState<StateAdminFinancialFilters>({
    startDate: "2026-04-01",
    endDate: new Date().toISOString().split("T")[0],
    page: 1,
    limit: 10,
  });

  const [data, setData] = useState<FinancialReportResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReport = useCallback(
    async (nextFilters?: StateAdminFinancialFilters) => {
      try {
        setLoading(true);
        const activeFilters = nextFilters ?? filters;
        const result = await getStateFinancialReport(activeFilters);
        setData(result);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to fetch state financial report",
        );
      } finally {
        setLoading(false);
      }
    },
    [filters],
  );

  useEffect(() => {
    fetchReport();
  }, []);

  const updateFilters = (newFields: Partial<StateAdminFinancialFilters>) => {
    const nextFilters = { ...filters, ...newFields, page: 1 };
    setFilters(nextFilters);
    fetchReport(nextFilters);
  };

  return {
    data,
    filters,
    loading,
    error,
    refetch: () => fetchReport(),
    search: (val: string) => updateFilters({ search: val.trim() || undefined }),
    setDistrict: (val: string) =>
      updateFilters({ district: val.trim() || undefined }),
    setGatc: (val: string) =>
      updateFilters({ gatcId: val.trim() || undefined }),
    setDateRange: (start: string, end: string) =>
      updateFilters({
        startDate: start || undefined,
        endDate: end || undefined,
      }),
    setPage: (page: number) => {
      setFilters((f) => ({ ...f, page }));
      fetchReport({ ...filters, page });
    },
    setApplicationType: (app: any) => updateFilters({ applicationType: app }),
    setWorkflowStatus: (status: any) => updateFilters({ workflowStatus: status }),
    setPaymentStatus: (status: any) => updateFilters({ paymentStatus: status }),
    exportReport: () => exportStateFinancialReport(filters),
  };
};
