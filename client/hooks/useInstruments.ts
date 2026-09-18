import { useQuery } from "@tanstack/react-query";

import {
  getInstrumentSearch,
  getVerifiedInstruments,
} from "@/services/instrument.service";

export const useInstruments = (userId: string | undefined, search: string) => {
  const trimmedSearch = search.trim();

  const query = useQuery({
    queryKey: ["instruments", userId, trimmedSearch],

    queryFn: () => {
      if (!userId) {
        throw new Error("User ID is required");
      }

      if (trimmedSearch) {
        return getInstrumentSearch(userId, trimmedSearch);
      }

      return getVerifiedInstruments(userId);
    },

    enabled: Boolean(userId),
    staleTime: 30_000,
  });

  return {
    instruments: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
};
