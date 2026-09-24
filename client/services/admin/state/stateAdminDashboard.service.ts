import { api } from "@/lib/api";

export const getStateAdminDashboard = async (financialYear?: string) => {
  const response = await api.get("/state-admin/dashboard", {
    params: { financialYear },
  });
  return response.data.data;
};

export const getStateAdminAllocations = async () => {
  const response = await api.get("/state-admin/allocations");
  return response.data.data;
};

export const downloadStateAdminDashboardReport = async (
  financialYear?: string,
) => {
  const response = await api.get("/state-admin/dashboard/export", {
    params: { financialYear },
    responseType: "blob",
  });

  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute(
    "download",
    `state-report-${financialYear || "current"}.csv`,
  );
  document.body.appendChild(link);
  link.click();
  link.parentNode?.removeChild(link);
};

export const getStateAdminGatcs = async (district?: string) => {
  const response = await api.get("/state-admin/gatcs", {
    params: { district: district === "All" ? undefined : district },
  });
  return response.data.data;
};
