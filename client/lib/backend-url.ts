const configuredBackendUrl = import.meta.env.VITE_BACKEND_URL?.trim();
const developmentBackendUrl = import.meta.env.DEV
  ? "http://localhost:8080"
  : window.location.origin;

export const backendUrl = (configuredBackendUrl || developmentBackendUrl).replace(
  /\/$/,
  "",
);

export const mockMode =
  import.meta.env.VITE_MOCK_MODE?.trim().toLowerCase() === "true";