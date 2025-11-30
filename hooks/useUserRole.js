import { useState, useEffect } from "react";
import { useAuth } from "@clerk/clerk-expo";
import api from "../api/index.js";
import * as SecureStore from "expo-secure-store";

export default function useUserRole() {
  const { getToken } = useAuth();
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserRole();
  }, []);

  const fetchUserRole = async () => {
    try {
      const token = await getToken();

      if (!token) {
        setLoading(false);
        return;
      }

      await SecureStore.setItemAsync("clerkToken", token);

      const { data } = await api.get("/api/user", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (data.success) {
        setRole(data.role);
      }

      setLoading(false);
    } catch (error) {
      console.error("Error fetching user role:", error);
      setLoading(false);
    }
  };

  return { role, loading, isHotelOwner: role === "hotelOwner" };
}