import axios from "axios";

// Create axios instance with default config
const instance = axios.create({
  baseURL: import.meta.env.PROD
    ? "https://yuqing-xu-yujing-cen-project3-okhg.onrender.com/api"
    : "http://localhost:3000/api",
  withCredentials: true, // Enable sending cookies
  timeout: 5000, // 5 second timeout
  headers: {
    "Content-Type": "application/json",
  },
});

// Add request interceptor for logging
instance.interceptors.request.use(
  (config) => {
    console.log(`🚀 ${config.method.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error("❌ Request error:", error);
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
instance.interceptors.response.use(
  (response) => {
    console.log(`✅ ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    if (error.response) {
      // Server responded with error status
      console.error(
        `❌ ${error.response.status} ${error.config.url}:`,
        error.response.data
      );

      // Redirect to login page on authentication errors
      if (error.response.status === 401) {
        console.log("🔑 Unauthorized, redirecting to login page");
        window.location.href = "/login";
      }
    } else if (error.request) {
      // Request made but no response received
      console.error("❌ No response received:", error.request);
    } else {
      // Error in request configuration
      console.error("❌ Request configuration error:", error.message);
    }
    return Promise.reject(error);
  }
);

export default instance;
