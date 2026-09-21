import {
  GatcDashboard,
  GatcStatus,
  gatcService,
  CreateGatcPayload,
  RenewGatcPayload,
  GatcListItem,
  GatcListResponse,
  GatcProfile,
} from "@/services/admin/gatc.service";
import { useCallback, useEffect, useState } from "react";

const PAGE_SIZE = 10;

export function useGatc() {
  const [dashboard, setDashboard] = useState<GatcDashboard | null>(null);
  const [gatcs, setGatcs] = useState<GatcListItem[]>([]);
  const [pagination, setPagination] = useState<
    GatcListResponse["pagination"] | null
  >(null);
  const [loadingDashboard, setLoadingDashboard] = useState(true);
  const [loadingGatcs, setLoadingGatcs] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<GatcStatus | undefined>();
  const fetchDashboard = useCallback(async () => {
    try {
      setLoadingDashboard(true);

      const data = await gatcService.getDashboard();

      setDashboard(data);
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Failed to load dashboard",
      );
    } finally {
      setLoadingDashboard(false);
    }
  }, []);

  const fetchGatcs = useCallback(async () => {
    try {
      setLoadingGatcs(true);

      const response = await gatcService.getGatcs({
        search: search || undefined,
        status,
        page,
        limit: PAGE_SIZE,
      });

      setGatcs(response.data);
      setPagination(response.pagination);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to load GATCs");
    } finally {
      setLoadingGatcs(false);
    }
  }, [search, status, page]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  useEffect(() => {
    fetchGatcs();
  }, [fetchGatcs]);

  const createGatc = async (payload: CreateGatcPayload) => {
    try {
      setActionLoading(true);
      setError(null);

      const created = await gatcService.createGatc(payload);

      await Promise.all([fetchDashboard(), fetchGatcs()]);

      return created;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to authorize GATC";

      setError(message);

      throw error;
    } finally {
      setActionLoading(false);
    }
  };

  const updateStatus = async (gatcId: string, newStatus: GatcStatus) => {
    try {
      setActionLoading(true);
      setError(null);

      const updated = await gatcService.updateStatus(gatcId, newStatus);

      await Promise.all([fetchDashboard(), fetchGatcs()]);

      return updated;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to update GATC status";

      setError(message);

      throw error;
    } finally {
      setActionLoading(false);
    }
  };

  const renewGatc = async (gatcId: string, payload: RenewGatcPayload) => {
    try {
      setActionLoading(true);
      setError(null);

      const updated = await gatcService.renewGatc(gatcId, payload);

      await Promise.all([fetchDashboard(), fetchGatcs()]);

      return updated;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to renew GATC";

      setError(message);

      throw error;
    } finally {
      setActionLoading(false);
    }
  };

  const getGatcProfile = async (gatcId: string): Promise<GatcProfile> => {
    return gatcService.getGatcProfile(gatcId);
  };

  const nextPage = () => {
    if (pagination && page < pagination.totalPages) {
      setPage((current) => current + 1);
    }
  };

  const previousPage = () => {
    setPage((current) => Math.max(current - 1, 1));
  };

  const searchGatcs = (value: string) => {
    setPage(1);
    setSearch(value);
  };

  const filterByStatus = (value: GatcStatus | undefined) => {
    setPage(1);
    setStatus(value);
  };

  return {
    dashboard,

    gatcs,
    pagination,

    page,
    search,
    status,

    loadingDashboard,
    loadingGatcs,
    actionLoading,

    error,

    fetchDashboard,
    fetchGatcs,

    createGatc,
    updateStatus,
    renewGatc,
    getGatcProfile,

    searchGatcs,
    filterByStatus,

    nextPage,
    previousPage,
  };
}
