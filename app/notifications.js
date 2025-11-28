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

  // Función para obtener las reservas del usuario
  const fetchBookings = async () => {
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
        const bookingNotifications = data.bookings.map((booking) => ({
          id: booking._id,
          type: getNotificationType(booking.isPaid),
          title: getNotificationTitle(booking.isPaid),
          message: getNotificationMessage(booking),
          time: getTimeAgo(booking.createdAt),
          date: new Date(booking.createdAt),
          booking: booking,
        }));

        bookingNotifications.sort((a, b) => b.date - a.date);

        setNotifications(bookingNotifications);
        console.log("✅ Notifications loaded:", bookingNotifications.length);
      } else {
        console.error("❌ Invalid response format:", data);
        setNotifications([]);
      }

      setLoading(false);
    } catch (error) {
      console.error("Error fetching bookings:", error);

      if (error.response?.status === 401) {
        try {
          console.log("🔄 Token expired, refreshing...");
          const newToken = await getToken({ skipCache: true });

          if (newToken) {
            await SecureStore.setItemAsync("clerkToken", newToken);
            const { data } = await api.get("/api/bookings/user", {
              headers: {
                Authorization: `Bearer ${newToken}`,
              },
            });

            if (data.success && data.bookings) {
              const bookingNotifications = data.bookings.map((booking) => ({
                id: booking._id,
                type: getNotificationType(booking.isPaid),
                title: getNotificationTitle(booking.isPaid),
                message: getNotificationMessage(booking),
                time: getTimeAgo(booking.createdAt),
                date: new Date(booking.createdAt),
                booking: booking,
              }));

              bookingNotifications.sort((a, b) => b.date - a.date);
              setNotifications(bookingNotifications);
              console.log("✅ Notifications loaded after token refresh");
            }
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

  const getNotificationType = (isPaid) => {
    return isPaid ? "booking" : "payment";
  };

  const getNotificationTitle = (isPaid) => {
    return isPaid ? "Payment Successful" : "Payment Pending";
  };

  const getNotificationMessage = (booking) => {
    const checkIn = new Date(booking.checkInDate).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
    const checkOut = new Date(booking.checkOutDate).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

    let message = "";
    
    if (booking.isPaid) {
      message = `Thank you for your payment! Your reservation from ${checkIn} to ${checkOut} is confirmed. Total paid: $${booking.totalPrice}`;
    } else {
      message = `Payment required for your booking from ${checkIn} to ${checkOut}. Total: $${booking.totalPrice}. Payment method: ${booking.paymentMethod}`;
    }

    return message;
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

  useEffect(() => {
    fetchBookings();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchBookings();
  };

  const deleteNotification = (id) => {
    setNotifications(notifications.filter((notif) => notif.id !== id));
  };

  const getIconName = (type) => {
    switch (type) {
      case "booking":
        return "checkmark-circle";
      case "payment":
        return "card";
      default:
        return "notifications";
    }
  };

  const getIconColor = (type) => {
    switch (type) {
      case "booking":
        return { bg: "bg-green-100", color: "#22c55e" };
      case "payment":
        return { bg: "bg-orange-100", color: "#f97316" };
      default:
        return { bg: "bg-gray-100", color: "#6b7280" };
    }
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
      {/* Header */}
      <View className="px-6 py-4 border-b border-gray-200 bg-white">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => router.back()} className="mr-4">
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text className="text-2xl font-bold">Notifications</Text>
        </View>
      </View>

      {/* Lista de notificaciones */}
      <ScrollView
        className="flex-1"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {notifications.length > 0 ? (
          notifications.map((notification) => {
            const iconStyle = getIconColor(notification.type);
            return (
              <View
                key={notification.id}
                className="px-6 py-4 border-b border-gray-100 bg-white"
              >
                <View className="flex-row items-start">
                  {/* Icono */}
                  <View className={`w-12 h-12 rounded-full items-center justify-center ${iconStyle.bg}`}>
                    <Ionicons
                      name={getIconName(notification.type)}
                      size={24}
                      color={iconStyle.color}
                    />
                  </View>

                  {/* Contenido */}
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
                      <View className={`px-2 py-1 rounded-full ${
                        notification.booking.isPaid
                          ? "bg-green-100"
                          : "bg-red-100"
                      }`}>
                        <Text className={`text-xs font-semibold ${
                          notification.booking.isPaid
                            ? "text-green-700"
                            : "text-red-700"
                        }`}>
                          {notification.booking.isPaid ? "PAID" : "UNPAID"}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Botón de eliminar */}
                  <TouchableOpacity
                    onPress={() => deleteNotification(notification.id)}
                    className="ml-2 p-2"
                  >
                    <Ionicons name="trash-outline" size={20} color="#ef4444" />
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
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