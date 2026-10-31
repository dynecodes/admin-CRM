import axios from "axios";

// use environment variable for localhost, fallback to relative path for production
const BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api/v2";

console.log("API Base URL:", BASE_URL); // Debug log

export default axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
});

export const privateService = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});