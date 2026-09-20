let configuredBackendUrl = import.meta.env.VITE_BACKEND_URL?.trim();

// If the env file hardcodes localhost, but the user is accessing via a local network IP (like their phone),
// replace 'localhost' with the actual network IP so the API request doesn't fail on the mobile device.
if (
  configuredBackendUrl &&
  configuredBackendUrl.includes("localhost") &&
  window.location.hostname !== "localhost"
) {
  configuredBackendUrl = configuredBackendUrl.replace("localhost", window.location.hostname);
}

const developmentBackendUrl = import.meta.env.DEV
  ? `${window.location.protocol}//${window.location.hostname}:8080`
  : window.location.origin;

export const backendUrl = (configuredBackendUrl || developmentBackendUrl).replace(
  /\/$/,
  "",
);

export const mockMode =
  import.meta.env.VITE_MOCK_MODE?.trim().toLowerCase() === "true";
