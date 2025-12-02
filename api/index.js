import axios from "axios";
import * as SecureStore from "expo-secure-store";

export const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || "http://192.168.100.22:3000";

const api = axios.create({
  baseURL: BACKEND_URL,
  timeout: 50000,
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

// Interceptor de response
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      console.log("🔒 Token inválido o expirado, eliminando...");
      await SecureStore.deleteItemAsync("clerkToken");
    }
    return Promise.reject(error);
  }
);

export default api;