import axios from "axios";
import * as SecureStore from "expo-secure-store";

export const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || "http://localhost:3000";

const api = axios.create({
  baseURL: BACKEND_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Interceptor de request
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await SecureStore.getItemAsync("clerkToken");
      
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      } else {
        console.log("⚠️ No hay token disponible");
      }
    } catch (error) {
      console.error("❌ Error obteniendo token:", error);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ⭐ INTERCEPTOR PARA MANEJAR TOKENS EXPIRADOS
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Si el token expiró y no hemos reintentado aún
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Obtener nuevo token de SecureStore
        const token = await SecureStore.getItemAsync("clerkToken");
        
        if (token) {
          // Actualizar header con nuevo token
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        console.error("Failed to refresh token:", refreshError);
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  }
);

export default api;