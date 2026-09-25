import axios from "axios";
import { backendUrl } from "./backend-url";

export const api = axios.create({
  baseURL: `${backendUrl}/api`,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("emaap_auth_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem("emaap_auth_token");
      localStorage.removeItem("emaap_role");
      localStorage.removeItem("emaap_current_user");
      window.location.href = "/";
    }
    return Promise.reject(error);
  }
);
