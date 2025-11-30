import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator, Alert } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@clerk/clerk-expo";
import api from "../api/index.js";
import * as SecureStore from "expo-secure-store";
import useUserRole from "../hooks/useUserRole";

export default function Dashboard() {
  const router = useRouter();
  const { getToken } = useAuth();
  const { isHotelOwner, loading: roleLoading } = useUserRole();
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState([]);
  
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [totalBookings, setTotalBookings] = useState(0);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [paidCount, setPaidCount] = useState(0);
  const [unpaidCount, setUnpaidCount] = useState(0);

  useEffect(() => {
    if (!roleLoading) {
      if (!isHotelOwner) {
        router.replace("/notifications");
        return;
      }
      fetchDashboardData();
    }
  }, [roleLoading, isHotelOwner]);

  const fetchDashboardData = async () => {
    try {
      const token = await getToken();

      if (!token) {
        throw new Error("No token available");
      }

      await SecureStore.setItemAsync("clerkToken", token);

      const { data } = await api.get("/api/bookings/hotel", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (data.success && data.dashboardData) {
        const { bookings: bookingsData, totalBookings: total, totalRevenue: revenue } = data.dashboardData;

        setBookings(bookingsData);
        setTotalBookings(total);
        setTotalRevenue(revenue);
        setPaidCount(bookingsData.filter(b => b.isPaid).length);
        setUnpaidCount(bookingsData.filter(b => !b.isPaid).length);
        setCurrentPage(1);
      }

      setLoading(false);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);

      if (error.response?.status === 401) {
        try {
          const newToken = await getToken({ skipCache: true });

          if (newToken) {
            await SecureStore.setItemAsync("clerkToken", newToken);
            await fetchDashboardData();
          } else {
            Alert.alert("Session Expired", "Please sign in again");
            router.push("/(auth)/sign-in");
          }
        } catch (refreshError) {
          console.error("Failed to refresh token:", refreshError);
          Alert.alert("Session Expired", "Please sign in again");
          router.push("/(auth)/sign-in");
        }
      }
      
      setLoading(false);
    } finally {
      setRefreshing(false);
    }
  };

  const getTimeAgo = (date) => {
    const now = new Date();
    const bookingDate = new Date(date);
    const diffMs = now - bookingDate;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) {
      return diffMins <= 1 ? "Just now" : `${diffMins} minutes ago`;
    } else if (diffHours < 24) {
      return diffHours === 1 ? "1 hour ago" : `${diffHours} hours ago`;
    } else if (diffDays < 7) {
      return diffDays === 1 ? "1 day ago" : `${diffDays} days ago`;
    } else {
      const weeks = Math.floor(diffDays / 7);
      return weeks === 1 ? "1 week ago" : `${weeks} weeks ago`;
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchDashboardData();
  };

  const totalPages = Math.ceil(bookings.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentBookings = bookings.slice(startIndex, endIndex);

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const goToPage = (page) => {
    setCurrentPage(page);
  };

  if (loading || roleLoading) {
    return (
      <View className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator size="large" color="#a855f7" />
        <Text className="text-gray-500 mt-4">Loading dashboard...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white py-16">
      <View className="px-6 py-4 border-b border-gray-200 bg-white">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center">
            <TouchableOpacity onPress={() => router.back()} className="mr-4">
              <Ionicons name="arrow-back" size={24} color="#333" />
            </TouchableOpacity>
            <Text className="text-2xl font-bold">Dashboard</Text>
          </View>
          
          <View className="px-3 py-1 rounded-full bg-purple-100">
            <Text className="text-xs font-semibold text-purple-700">
              HOTEL OWNER
            </Text>
          </View>
        </View>
      </View>

      {/* 🔥 Estadísticas */}
      <View className="px-6 py-4 bg-purple-50 border-b border-purple-100">
        <View className="flex-row justify-around">
          <View className="items-center">
            <Text className="text-2xl font-bold text-purple-700">
              {totalBookings}
            </Text>
            <Text className="text-xs text-gray-600">Total Bookings</Text>
          </View>
          <View className="items-center">
            <Text className="text-2xl font-bold text-green-600">
              {paidCount}
            </Text>
            <Text className="text-xs text-gray-600">Paid</Text>
          </View>
          <View className="items-center">
            <Text className="text-2xl font-bold text-red-600">
              {unpaidCount}
            </Text>
            <Text className="text-xs text-gray-600">Unpaid</Text>
          </View>
          <View className="items-center">
            <Text className="text-2xl font-bold text-blue-600">
              ${totalRevenue}
            </Text>
            <Text className="text-xs text-gray-600">Total Revenue</Text>
          </View>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {bookings.length > 0 ? (
          <>
            {/* Lista de reservas */}
            {currentBookings.map((booking) => (
              <View
                key={booking._id}
                className="px-6 py-4 border-b border-gray-100 bg-white"
              >
                <View className="flex-row items-start">
                  <View className="w-12 h-12 rounded-full items-center justify-center bg-purple-100">
                    <Ionicons name="calendar" size={24} color="#a855f7" />
                  </View>

                  <View className="flex-1 ml-4">
                    <Text className="font-semibold text-base text-gray-900 mb-1">
                      New Booking at {booking.hotel.name}
                    </Text>
                    <Text className="text-gray-600 text-sm mb-2 pr-4">
                      {booking.user.username} booked {booking.room.roomType}. Total: ${booking.totalPrice}. Check-in: {new Date(booking.checkInDate).toLocaleDateString()}
                    </Text>
                    
                    {/* Información del cliente */}
                    <View className="flex-row items-center mb-2 bg-gray-50 p-2 rounded-lg">
                      <Ionicons name="person-circle" size={16} color="#6b7280" />
                      <Text className="text-xs text-gray-600 ml-1">
                        {booking.user.username} ({booking.user.email})
                      </Text>
                    </View>
                    
                    <View className="flex-row items-center justify-between">
                      <Text className="text-gray-400 text-xs">
                        {getTimeAgo(booking.createdAt)}
                      </Text>
                      
                      <View className="flex-row gap-2">
                        <View className="px-2 py-1 rounded-full bg-purple-100">
                          <Text className="text-xs font-semibold text-purple-700">
                            BOOKING
                          </Text>
                        </View>
                        {booking.isPaid ? (
                          <View className="px-2 py-1 rounded-full bg-green-100">
                            <Text className="text-xs font-semibold text-green-700">PAID</Text>
                          </View>
                        ) : (
                          <View className="px-2 py-1 rounded-full bg-red-100">
                            <Text className="text-xs font-semibold text-red-700">UNPAID</Text>
                          </View>
                        )}
                      </View>
                    </View>
                  </View>
                </View>
              </View>
            ))}

            {/* Controles de Paginación */}
            {totalPages > 1 && (
              <View className="px-6 py-6 bg-white border-t border-gray-200">
                <View className="flex-row items-center justify-between mb-3">
                  <Text className="text-sm text-gray-600">
                    Showing {startIndex + 1}-{Math.min(endIndex, bookings.length)} of {bookings.length}
                  </Text>
                  <Text className="text-sm text-gray-600">
                    Page {currentPage} of {totalPages}
                  </Text>
                </View>

                <View className="flex-row items-center justify-center gap-2">
                  <TouchableOpacity
                    onPress={goToPreviousPage}
                    disabled={currentPage === 1}
                    className={`px-4 py-2 rounded-lg ${
                      currentPage === 1 ? "bg-gray-200" : "bg-purple-500"
                    }`}
                  >
                    <View className="flex-row items-center">
                      <Ionicons 
                        name="chevron-back" 
                        size={16} 
                        color={currentPage === 1 ? "#999" : "white"} 
                      />
                      <Text className={`ml-1 font-semibold ${
                        currentPage === 1 ? "text-gray-400" : "text-white"
                      }`}>
                        Previous
                      </Text>
                    </View>
                  </TouchableOpacity>

                  <View className="flex-row gap-2">
                    {[...Array(totalPages)].map((_, index) => {
                      const page = index + 1;
                      if (
                        page === 1 ||
                        page === totalPages ||
                        (page >= currentPage - 1 && page <= currentPage + 1)
                      ) {
                        return (
                          <TouchableOpacity
                            key={page}
                            onPress={() => goToPage(page)}
                            className={`w-10 h-10 rounded-lg items-center justify-center ${
                              currentPage === page ? "bg-purple-500" : "bg-gray-200"
                            }`}
                          >
                            <Text className={`font-semibold ${
                              currentPage === page ? "text-white" : "text-gray-700"
                            }`}>
                              {page}
                            </Text>
                          </TouchableOpacity>
                        );
                      } else if (page === currentPage - 2 || page === currentPage + 2) {
                        return (
                          <View key={page} className="w-10 h-10 items-center justify-center">
                            <Text className="text-gray-400">...</Text>
                          </View>
                        );
                      }
                      return null;
                    })}
                  </View>

                  <TouchableOpacity
                    onPress={goToNextPage}
                    disabled={currentPage === totalPages}
                    className={`px-4 py-2 rounded-lg ${
                      currentPage === totalPages ? "bg-gray-200" : "bg-purple-500"
                    }`}
                  >
                    <View className="flex-row items-center">
                      <Text className={`mr-1 font-semibold ${
                        currentPage === totalPages ? "text-gray-400" : "text-white"
                      }`}>
                        Next
                      </Text>
                      <Ionicons 
                        name="chevron-forward" 
                        size={16} 
                        color={currentPage === totalPages ? "#999" : "white"} 
                      />
                    </View>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </>
        ) : (
          <View className="flex-1 items-center justify-center py-20">
            <View className="w-32 h-32 rounded-full bg-purple-100 items-center justify-center mb-4">
              <Ionicons name="stats-chart" size={64} color="#a855f7" />
            </View>
            <Text className="text-gray-400 text-lg font-semibold">
              No bookings yet
            </Text>
            <Text className="text-gray-400 text-sm mt-2 text-center px-8">
              When guests book your hotels, they will appear here
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}