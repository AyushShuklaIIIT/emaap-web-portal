import {
  exportFinancialReport,
  FinancialReportFilters,
  FinancialReportResponse,
  getFinancialReport,
} from "@/services/admin/financial.service";
import { useCallback, useEffect, useState } from "react";

const DEFAULT_LIMIT = 10;

export const useFinancialReport = () => {
  const [filters, setFilters] = useState<FinancialReportFilters>({
    startDate: "2026-04-01",
    endDate: "2026-09-05",
    page: 1,
    limit: DEFAULT_LIMIT,
  });

  const [data, setData] = useState<FinancialReportResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReport = useCallback(
    async (nextFilters?: FinancialReportFilters) => {
      try {
        setLoading(true);
        setError(null);

        const activeFilters = nextFilters ?? filters;

        const result = await getFinancialReport(activeFilters);

        setData(result);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to fetch financial report",
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

  const updateFilters = useCallback(
    (nextFilters: FinancialReportFilters) => {
      setFilters(nextFilters);

      fetchReport(nextFilters);
    },
    [fetchReport],
  );

  const search = useCallback(
    (searchValue: string) => {
      const nextFilters = {
        ...filters,
        search: searchValue.trim() || undefined,
        page: 1,
      };

      updateFilters(nextFilters);
    },
    [filters, updateFilters],
  );

  const setDateRange = useCallback(
    (startDate: string, endDate: string) => {
      const nextFilters = {
        ...filters,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        page: 1,
      };

      updateFilters(nextFilters);
    },
    [filters, updateFilters],
  );

  const setPage = useCallback(
    (page: number) => {
      const nextFilters = {
        ...filters,
        page,
      };

      updateFilters(nextFilters);
    },
    [filters, updateFilters],
  );

  const setApplicationType = useCallback(
    (applicationType: "INITIAL" | "RE_VERIFICATION" | undefined) => {
      const nextFilters = {
        ...filters,
        applicationType,
        page: 1,
      };

      updateFilters(nextFilters);
    },
    [filters, updateFilters],
  );

  const setWorkflowStatus = useCallback(
    (
      workflowStatus:
        "SUBMITTED" | "ALLOCATED" | "CERTIFIED" | "REJECTED" | undefined,
    ) => {
      const nextFilters = {
        ...filters,
        workflowStatus,
        page: 1,
      };

      updateFilters(nextFilters);
    },
    [filters, updateFilters],
  );

  const setPaymentStatus = useCallback(
    (paymentStatus: "PENDING" | "SUCCESS" | "FAILED" | undefined) => {
      const nextFilters = {
        ...filters,
        paymentStatus,
        page: 1,
      };

      updateFilters(nextFilters);
    },
    [filters, updateFilters],
  );

  const exportReport = useCallback(async () => {
    await exportFinancialReport(filters);
  }, [filters]);

  return {
    data,
    filters,
    loading,
    error,

    refetch: () => fetchReport(),

    search,
    setDateRange,
    setPage,
    setApplicationType,
    setWorkflowStatus,
    setPaymentStatus,
    exportReport,
  };
};
