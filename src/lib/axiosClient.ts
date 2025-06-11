import axios from "axios";
import { message } from "antd";

// For SSR compatibility, we need to check if window is defined
const isClient = typeof window !== "undefined";

// Create a function to get the global loading functions from context
// Will be set after LoadingContext is initialized
let globalShowLoading: (() => void) | null = null;
let globalHideLoading: (() => void) | null = null;

// Function to set global loading methods
export const setGlobalLoadingHandlers = (
  showLoading: () => void,
  hideLoading: () => void
) => {
  globalShowLoading = showLoading;
  globalHideLoading = hideLoading;
};

const axiosClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/",
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});


// Request interceptor: tự động gắn access token nếu có
axiosClient.interceptors.request.use(
  (config) => {
    // Show loading on request start
    if (isClient && globalShowLoading) {
      globalShowLoading();
    }
    
    if (isClient) {
      const token = localStorage.getItem("access_token");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    // Hide loading on request error
    if (isClient && globalHideLoading) {
      globalHideLoading();
    }
    return Promise.reject(error);
  }
);

// Response interceptor: xử lý lỗi toàn cục
axiosClient.interceptors.response.use(
  (response) => {
    // Hide loading on response success
    if (isClient && globalHideLoading) {
      globalHideLoading();
    }
    return response;
  },
  (error) => {
    // Hide loading on response error
    if (isClient && globalHideLoading) {
      globalHideLoading();
    }

    if (error.response) {
      const status = error.response.status;

      if (status === 401) {
        if (isClient) {
          window.location.href = "/";
        }
      }

      if (status === 500) {
        if (isClient) {
          message.error("Lỗi server, vui lòng thử lại sau.");
        } else {
          console.error("Lỗi server, vui lòng thử lại sau.");
        }
      }
    }

    return Promise.reject(error);
  }
);

export default axiosClient;
