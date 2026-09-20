import axios from "axios";
import { backendUrl } from "./backend-url";

export const api = axios.create({
  baseURL: `${backendUrl}/api`,
  headers: {
    "Content-Type": "application/json",
  },
});
