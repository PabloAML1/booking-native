import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator, Alert } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@clerk/clerk-expo";
import api from "../api/index.js";
import * as SecureStore from "expo-secure-store";

export default function Notifications() {
  const router = useRouter();
  const { getToken } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);
  
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
      fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const token = await getToken();

      if (!token) {
        throw new Error("No token available");
      }

      await SecureStore.setItemAsync("clerkToken", token);

      const { data } = await api.get("/api/bookings/user", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (data.success && data.bookings) {
        const notificationsData = data.bookings.map((booking) => ({
          id: booking._id,
          type: booking.isPaid ? "payment" : "booking",
          title: booking.isPaid ? "Payment Confirmed" : "Booking Pending",
          message: `${booking.hotel.name} - ${booking.room.roomType}. Total: $${booking.totalPrice}. Check-in: ${new Date(booking.checkInDate).toLocaleDateString()}`,
          time: getTimeAgo(booking.createdAt),
          date: new Date(booking.createdAt),
          booking: booking,
          isRead: false,
          isPaid: booking.isPaid,
        }));

        notificationsData.sort((a, b) => b.date - a.date);
        setNotifications(notificationsData);
        setCurrentPage(1);
        console.log("✅ User notifications loaded:", notificationsData.length);
      }

      setLoading(false);
    } catch (error) {
      console.error("Error fetching notifications:", error);

      if (error.response?.status === 401) {
        try {
          const newToken = await getToken({ skipCache: true });

          if (newToken) {
            await SecureStore.setItemAsync("clerkToken", newToken);
            await fetchNotifications();
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
    const notifDate = new Date(date);
    const diffMs = now - notifDate;
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
    await fetchNotifications();
  };

  const getIconName = (type) => {
    switch (type) {
      case "booking":
        return "calendar";
      case "payment":
        return "checkmark-circle";
      default:
        return "notifications";
    }
  };

  const getIconColor = (type) => {
    switch (type) {
      case "booking":
        return { bg: "bg-blue-100", color: "#3b82f6" };
      case "payment":
        return { bg: "bg-green-100", color: "#22c55e" };
      default:
        return { bg: "bg-gray-100", color: "#6b7280" };
    }
  };

  const getStatusBadge = (notification) => {
    if (notification.isPaid) {
      return (
        <View className="px-2 py-1 rounded-full bg-green-100">
          <Text className="text-xs font-semibold text-green-700">PAID</Text>
        </View>
      );
    }
    
    return (
      <View className="px-2 py-1 rounded-full bg-red-100">
        <Text className="text-xs font-semibold text-red-700">UNPAID</Text>
      </View>
    );
  };

  const totalPages = Math.ceil(notifications.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentNotifications = notifications.slice(startIndex, endIndex);

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

  if (loading) {
    return (
      <View className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text className="text-gray-500 mt-4">Loading notifications...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white py-16">
      <View className="px-6 py-4 border-b border-gray-200 bg-white">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => router.back()} className="mr-4">
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text className="text-2xl font-bold">My Notifications</Text>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {notifications.length > 0 ? (
          <>
            {/* Lista de notificaciones paginadas */}
            {currentNotifications.map((notification) => {
              const iconStyle = getIconColor(notification.type);
              return (
                <View
                  key={notification.id}
                  className={`px-6 py-4 border-b border-gray-100 ${
                    notification.isRead ? "bg-white" : "bg-blue-50"
                  }`}
                >
                  <View className="flex-row items-start">
                    <View className={`w-12 h-12 rounded-full items-center justify-center ${iconStyle.bg}`}>
                      <Ionicons
                        name={getIconName(notification.type)}
                        size={24}
                        color={iconStyle.color}
                      />
                    </View>

                    <View className="flex-1 ml-4">
                      <Text className="font-semibold text-base text-gray-900 mb-1">
                        {notification.title}
                      </Text>
                      <Text className="text-gray-600 text-sm mb-2 pr-4">
                        {notification.message}
                      </Text>
                      
                      <View className="flex-row items-center justify-between">
                        <Text className="text-gray-400 text-xs">
                          {notification.time}
                        </Text>
                        {getStatusBadge(notification)}
                      </View>
                    </View>
                  </View>
                </View>
              );
            })}

            {/* Controles de Paginación */}
            {totalPages > 1 && (
              <View className="px-6 py-6 bg-white border-t border-gray-200">
                <View className="flex-row items-center justify-between mb-3">
                  <Text className="text-sm text-gray-600">
                    Showing {startIndex + 1}-{Math.min(endIndex, notifications.length)} of {notifications.length}
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
                      currentPage === 1 ? "bg-gray-200" : "bg-blue-500"
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
                              currentPage === page ? "bg-blue-500" : "bg-gray-200"
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
                      currentPage === totalPages ? "bg-gray-200" : "bg-blue-500"
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
            <View className="w-32 h-32 rounded-full bg-gray-100 items-center justify-center mb-4">
              <Ionicons name="notifications-off-outline" size={64} color="#ccc" />
            </View>
            <Text className="text-gray-400 text-lg font-semibold">
              No notifications yet
            </Text>
            <Text className="text-gray-400 text-sm mt-2 text-center px-8">
              When you make a booking, notifications will appear here
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}