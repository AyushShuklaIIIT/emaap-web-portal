import {
  getPaymentDashboard,
  getPaymentReceipt,
} from "@/services/payment.service";
import { useQuery } from "@tanstack/react-query";

export const usePaymentDashboard = (userId: string) => {
  const query = useQuery({
    queryKey: ["payment-dashboard", userId],
    queryFn: () => getPaymentDashboard(userId),
    enabled: Boolean(userId),
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

export const usePaymentReceipt = (userId: string, receiptId: string) => {
  const query = useQuery({
    queryKey: ["payment-receipt", userId, receiptId],
    queryFn: () => getPaymentReceipt(userId, receiptId),
    enabled: Boolean(userId && receiptId),
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
