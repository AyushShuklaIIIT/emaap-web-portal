const configuredBackendUrl = import.meta.env.VITE_BACKEND_URL?.trim();

export const backendUrl = (
  configuredBackendUrl || window.location.origin
).replace(/\/$/, "");
