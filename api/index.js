import axios from "axios";
import * as SecureStore from "expo-secure-store";

export const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || "http://10.79.29.200:3000";

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
        console.log("✅ Token enviado:", token.substring(0, 20) + "..."); // Solo primeros 20 caracteres
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