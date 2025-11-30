import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useUser, useAuth } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import api from "../../api/index.js";
import * as SecureStore from "expo-secure-store";
import * as WebBrowser from "expo-web-browser";

export default function MyBookings() {
  const { isSignedIn } = useUser();
  const { getToken } = useAuth();
  const router = useRouter();

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(null);
  const [cancellingBooking, setCancellingBooking] = useState(null);

  const fetchUserBookings = async () => {
    if (!isSignedIn) {
      setLoading(false);
      return;
    }

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

      if (data.success) {
        setBookings(data.bookings);
      } else {
        Alert.alert("Error", data.message || "Failed to load bookings");
      }
    } catch (error) {
      console.error("Error fetching bookings:", error);

      if (error.response?.status === 401) {
        try {
          const newToken = await getToken({ skipCache: true });

          if (newToken) {
            await SecureStore.setItemAsync("clerkToken", newToken);
            const { data } = await api.get("/api/bookings/user", {
              headers: {
                Authorization: `Bearer ${newToken}`,
              },
            });

            if (data.success) {
              setBookings(data.bookings);
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
      } else {
        Alert.alert(
          "Error",
          error.response?.data?.message || "Failed to load bookings"
        );
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handlePayment = async (bookingId) => {
    try {
      setProcessingPayment(bookingId);

      let token = await getToken({ skipCache: true });

      if (!token) {
        throw new Error("No token available");
      }

      await SecureStore.setItemAsync("clerkToken", token);

      const { data } = await api.post(
        "/api/bookings/stripe-payment",
        { bookingId },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (data.success && data.url) {

        const result = await WebBrowser.openBrowserAsync(data.url, {
          showTitle: true,
          toolbarColor: "#3b82f6",
          controlsColor: "#ffffff",
          presentationStyle: WebBrowser.WebBrowserPresentationStyle.FULL_SCREEN,
        });

        if (result.type === "cancel" || result.type === "dismiss") {
          setTimeout(() => {
            fetchUserBookings();
          }, 2000);
        }
      } else {
        console.error("Error en respuesta:", {
          success: data.success,
          message: data.message,
          url: data.url,
          fullData: data,
        });
        Alert.alert(
          "Error",
          data.message || "Failed to create payment session"
        );
      }
    } catch (error) {
      console.error("Payment error completo:", error);
      console.error("Error response:", error.response?.data);
      console.error("Error status:", error.response?.status);
      console.error("Error message:", error.message);

      if (error.response?.status === 401) {
        try {
          const newToken = await getToken({ skipCache: true });

          if (newToken) {
            await SecureStore.setItemAsync("clerkToken", newToken);

            const { data } = await api.post(
              "/api/bookings/stripe-payment",
              { bookingId },
              {
                headers: {
                  Authorization: `Bearer ${newToken}`,
                },
              }
            );

            if (data.success && data.url) {

              const result = await WebBrowser.openBrowserAsync(data.url, {
                showTitle: true,
                toolbarColor: "#3b82f6",
                controlsColor: "#ffffff",
                presentationStyle:
                  WebBrowser.WebBrowserPresentationStyle.FULL_SCREEN,
              });

              if (result.type === "cancel" || result.type === "dismiss") {
                setTimeout(() => {
                  fetchUserBookings();
                }, 2000);
              }
            } else {
              console.error("Error en retry:", data);
              Alert.alert(
                "Error",
                data.message || "Failed to create payment session"
              );
            }
          } else {
            Alert.alert("Session Expired", "Please sign in again");
            router.push("/(auth)/sign-in");
          }
        } catch (retryError) {
          console.error("Failed to retry payment:", retryError);
          console.error("Retry error response:", retryError.response?.data);
          Alert.alert(
            "Payment Error",
            retryError.response?.data?.message ||
              "Session expired. Please try again after signing in."
          );
          router.push("/(auth)/sign-in");
        }
      } else {
        const errorMessage =
          error.response?.data?.message ||
          error.message ||
          "Failed to process payment";
        console.error("Mostrando error al usuario:", errorMessage);
        Alert.alert("Payment Error", errorMessage);
      }
    } finally {
      setProcessingPayment(null);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchUserBookings();
  };

  const handleCancelBooking = async (bookingId) => {
    Alert.alert(
      "Cancel Booking",
      "Are you sure you want to cancel this booking?",
      [
        { text: "No", style: "cancel" },
        {
          text: "Yes, Cancel",
          style: "destructive",
          onPress: async () => {
            try {
              setCancellingBooking(bookingId);

              const token = await getToken();

              if (!token) {
                throw new Error("No token available");
              }

              const { data } = await api.delete(
                `/api/bookings/cancel/${bookingId}`,
                {
                  headers: {
                    Authorization: `Bearer ${token}`,
                  },
                }
              );

              if (data.success) {
                Alert.alert("Success", "Booking cancelled successfully");
                fetchUserBookings();
              } else {
                Alert.alert(
                  "Error",
                  data.message || "Failed to cancel booking"
                );
              }
            } catch (error) {
              console.error("Cancel booking error:", error);
              Alert.alert(
                "Error",
                error.response?.data?.message || "Failed to cancel booking"
              );
            } finally {
              setCancellingBooking(null);
            }
          },
        },
      ]
    );
  };

  useEffect(() => {
    if (isSignedIn) {
      fetchUserBookings();
    } else {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSignedIn]);

  if (!isSignedIn) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <View className="flex-1 items-center justify-center px-6">
          <Ionicons name="calendar-outline" size={80} color="#d1d5db" />
          <Text className="text-2xl font-bold mt-6 mb-2">Sign In Required</Text>
          <Text className="text-gray-500 text-center mb-6">
            Please sign in to view your bookings
          </Text>
          <TouchableOpacity
            onPress={() => router.push("/(auth)/sign-in")}
            className="bg-blue-600 px-8 py-3 rounded-lg"
          >
            <Text className="text-white font-semibold text-base">Sign In</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text className="text-gray-500 mt-4">Loading bookings...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white pb-16">
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View className="px-6 ">
          <Text className="text-3xl font-bold mb-2">My Bookings</Text>
          <Text className="text-gray-500 mb-6">
            Easily manage your past, current, and upcoming hotel reservations
          </Text>

          {bookings.length === 0 ? (
            <View className="items-center justify-center py-16">
              <Ionicons name="calendar-outline" size={80} color="#d1d5db" />
              <Text className="text-gray-500 text-center mt-6 text-lg">
                You don't have any bookings yet
              </Text>
              <TouchableOpacity
                onPress={() => router.push("/(tabs)")}
                className="bg-blue-600 px-6 py-3 rounded-lg mt-6"
              >
                <Text className="text-white font-semibold">Browse Hotels</Text>
              </TouchableOpacity>
            </View>
          ) : (
            bookings.map((booking) => (
              <View
                key={booking._id}
                className="bg-white rounded-xl shadow-sm border border-gray-200 mb-4 overflow-hidden"
              >
                <Image
                  source={{ uri: booking.room.images[0] }}
                  className="w-full h-48"
                  resizeMode="cover"
                />

                <View className="p-4">
                  <Text className="text-xl font-bold mb-1">
                    {booking.hotel.name}
                  </Text>
                  <Text className="text-gray-600 text-sm mb-3">
                    ({booking.room.roomType})
                  </Text>

                  <View className="flex-row items-center mb-2">
                    <Ionicons name="location" size={16} color="#6b7280" />
                    <Text className="text-gray-600 text-sm ml-1">
                      {booking.hotel.address}
                    </Text>
                  </View>

                  <View className="flex-row items-center mb-4">
                    <Ionicons name="people" size={16} color="#6b7280" />
                    <Text className="text-gray-600 text-sm ml-1">
                      Guests: {booking.guests}
                    </Text>
                  </View>

                  <Text className="text-base font-semibold mb-4">
                    Total: ${booking.totalPrice}
                  </Text>

                  <View className="bg-gray-50 rounded-lg p-3 mb-4">
                    <View className="mb-3">
                      <Text className="text-xs text-gray-500 mb-1">
                        Check-in:
                      </Text>
                      <Text className="text-sm font-medium text-gray-700">
                        {new Date(booking.checkInDate).toDateString()}
                      </Text>
                    </View>
                    <View>
                      <Text className="text-xs text-gray-500 mb-1">
                        Check-out:
                      </Text>
                      <Text className="text-sm font-medium text-gray-700">
                        {new Date(booking.checkOutDate).toDateString()}
                      </Text>
                    </View>
                  </View>

                  <View className="flex-row items-center justify-between pt-3 border-t border-gray-200">
                    <View className="flex-row items-center gap-2">
                      <View
                        className={`h-3 w-3 rounded-full ${
                          booking.isPaid ? "bg-green-500" : "bg-red-500"
                        }`}
                      />
                      <Text
                        className={`text-sm font-semibold ${
                          booking.isPaid ? "text-green-500" : "text-red-500"
                        }`}
                      >
                        {booking.isPaid ? "Paid" : "Unpaid"}
                      </Text>
                    </View>

                    {/* PAY NOW BUTTON */}
                    {!booking.isPaid && (
                      <TouchableOpacity
                        onPress={() => handlePayment(booking._id)}
                        disabled={processingPayment === booking._id || cancellingBooking === booking._id}
                        className={`px-4 py-2 border border-gray-400 rounded-full flex-row items-center ${
                          processingPayment === booking._id || cancellingBooking === booking._id ? "opacity-50" : ""
                        }`}
                      >
                        {processingPayment === booking._id ? (
                          <>
                            <ActivityIndicator size="small" color="#000" />
                            <Text className="text-xs font-semibold ml-2">
                              Processing...
                            </Text>
                          </>
                        ) : (
                          <Text className="text-xs font-semibold">Pay Now</Text>
                        )}
                      </TouchableOpacity>
                    )}

                    {/* 🔥 CANCEL BUTTON CON INDICADOR */}
                    {!booking.isPaid && (
                      <TouchableOpacity
                        onPress={() => handleCancelBooking(booking._id)}
                        disabled={cancellingBooking === booking._id || processingPayment === booking._id}
                        className={`px-4 py-2 border border-red-500 rounded-full ml-2 flex-row items-center ${
                          cancellingBooking === booking._id || processingPayment === booking._id ? "opacity-50" : ""
                        }`}
                      >
                        {cancellingBooking === booking._id ? (
                          <>
                            <ActivityIndicator size="small" color="#ef4444" />
                            <Text className="text-xs font-semibold text-red-500 ml-2">
                              Cancelling...
                            </Text>
                          </>
                        ) : (
                          <Text className="text-xs font-semibold text-red-500">
                            Cancel
                          </Text>
                        )}
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}