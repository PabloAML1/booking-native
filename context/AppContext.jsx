import { createContext, useContext, useEffect, useState, useCallback } from "react";
import api from "../api";

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchRooms = useCallback(async () => {
  try {
    setLoading(true);

    const response = await api.get("/api/rooms");
    
    // Extraer el array de habitaciones
    setRooms(response.data.rooms);


  } catch (error) {
    console.error("❌ Error fetching rooms:", error.message);
    setRooms([]);
  } finally {
    setLoading(false);
  }
}, []);



  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]);

  const value = {
    rooms,
    loading,
    fetchRooms,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useAppContext must be used within AppProvider");
  }
  return context;
};