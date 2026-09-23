import {
  getGatcDashboard,
  getGatcSettings,
  RegisterGatcOfficerPayload,
  registerGatcOfficer,
} from "@/services/gatc/gatc.service";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export const gatcKeys = {
  all: ["gatc"] as const,
  dashboard: () => [...gatcKeys.all, "dashboard"] as const,
  settings: () => [...gatcKeys.all, "settings"] as const,
};

export const useGatcDashboard = () => {
  return useQuery({
    queryKey: gatcKeys.dashboard(),
    queryFn: getGatcDashboard,
  });
};

export const useGatcSettings = () => {
  return useQuery({
    queryKey: gatcKeys.settings(),
    queryFn: getGatcSettings,
  });
};

export const useRegisterGatcOfficer = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: RegisterGatcOfficerPayload) =>
      registerGatcOfficer(payload),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: gatcKeys.dashboard(),
      });
    },
  });
};
