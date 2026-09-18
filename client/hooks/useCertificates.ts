import { getCertificates } from "@/services/certificate.service";
import { useQuery } from "@tanstack/react-query";

export const useCertificates = (userId: string) => {
  const query = useQuery({
    queryKey: ["certificates", userId],

    queryFn: () => getCertificates(userId),

    enabled: Boolean(userId),

    staleTime: 30_000,
  });

  return {
    certificates: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
};
