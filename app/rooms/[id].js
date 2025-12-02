import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAppContext } from "../../context/AppContext";
import { useUser, useAuth } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import api from "../../api/index.js";
import * as SecureStore from "expo-secure-store";
import { sendLocalNotification, scheduleNotification } from "../../hooks/usePushNotifications";

const facilityIcons = {
  WiFi: "wifi",
  "Wi-Fi": "wifi",
  Parking: "car",
  "Air Conditioning": "snow",
  TV: "tv",
  Television: "tv",
  Pool: "water",
  Swimming: "water",
  Gym: "fitness",
  Fitness: "fitness",
  Spa: "flower",
  Restaurant: "restaurant",
  Breakfast: "restaurant",
  "Room Service": "fast-food",
  Bar: "beer",
  Kitchen: "restaurant-outline",
  Laundry: "shirt",
  "Pet Friendly": "paw",
  Safe: "lock-closed",
  Minibar: "beer-outline",
  Balcony: "home",
  "Coffee Maker": "cafe",
};

export default function RoomDetails() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { rooms } = useAppContext();
  const { user, isSignedIn } = useUser();
  const { getToken } = useAuth();

  const [room, setRoom] = useState(null);
  const [mainImage, setMainImage] = useState(null);
  const [checkInDate, setCheckInDate] = useState(new Date());
  const [checkOutDate, setCheckOutDate] = useState(
    new Date(Date.now() + 2 * 24 * 60 * 60 * 1000)
  );
  const [showCheckIn, setShowCheckIn] = useState(false);
  const [showCheckOut, setShowCheckOut] = useState(false);
  const [guests, setGuests] = useState(1);
  const [isAvailable, setIsAvailable] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const foundRoom = rooms.find((r) => r._id === id);
    if (foundRoom) {
      setRoom(foundRoom);
      setMainImage(foundRoom.images[0]);
    }
  }, [id, rooms]);

  const calculateNights = () => {
    const diffTime = Math.abs(checkOutDate - checkInDate);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const nights = calculateNights();
  const totalPrice = room ? room.pricePerNight * nights * guests : 0;

  const checkAvailability = async () => {
    if (!isSignedIn) {
      Alert.alert("Sign In Required", "Please sign in to check availability");
      router.push("/(auth)/sign-in");
      return;
    }

    if (nights < 2) {
      Alert.alert("Error", "The minimum stay is 2 nights");
      return;
    }

    setLoading(true);
    try {
      const token = await getToken({ skipCache: true });
      
      if (!token) {
        throw new Error("No token available");
      }

      await SecureStore.setItemAsync("clerkToken", token);

      const { data } = await api.post(
        "/api/bookings/check-availability",
        {
          room: id,
          dateRange: [
            {
              startDate: checkInDate.toISOString(),
              endDate: checkOutDate.toISOString(),
              key: "selection",
            },
          ],
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (data.success) {
        setIsAvailable(data.isAvailable);
        Alert.alert(
          data.isAvailable ? "Available!" : "Not Available",
          data.message ||
            (data.isAvailable
              ? "Room is available for booking"
              : "Room is not available for these dates")
        );
      } else {
        Alert.alert("Error", data.message || "Failed to check availability");
      }
    } catch (err) {
      if (err.response?.status === 401) {
        Alert.alert("Session Expired", "Please sign in again");
        router.push("/(auth)/sign-in");
        return;
      }

      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        "Failed to check availability. Please try again.";

      Alert.alert("Error", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleBooking = async () => {
    if (!isSignedIn) {
      Alert.alert("Sign In Required", "Please sign in to book a room", [
        { text: "Cancel", style: "cancel" },
        { text: "Sign In", onPress: () => router.push("/(auth)/sign-in") },
      ]);
      return;
    }

    if (!isAvailable) {
      await checkAvailability();
      return;
    }

    setLoading(true);
    try {
      const token = await getToken({ skipCache: true });
      
      if (!token) {
        throw new Error("No token available");
      }

      await SecureStore.setItemAsync("clerkToken", token);

      const { data } = await api.post(
        "/api/bookings/book",
        {
          room: id,
          dateRange: [
            {
              startDate: checkInDate.toISOString(),
              endDate: checkOutDate.toISOString(),
              key: "selection",
            },
          ],
          guests,
          paymentMethod: "Pay At Hotel",
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (data.success) {
        await sendLocalNotification(
          "🎉 Booking Confirmed!",
          `Your reservation at ${room.hotel.name} has been confirmed. Check-in: ${checkInDate.toLocaleDateString()}`,
          {
            bookingId: data.booking._id,
            hotelName: room.hotel.name,
            checkIn: checkInDate.toISOString(),
          }
        );

        const oneDayBefore = new Date(checkInDate);
        oneDayBefore.setDate(oneDayBefore.getDate() - 1);
        oneDayBefore.setHours(10, 0, 0, 0); // 10:00 AM

        if (oneDayBefore > new Date()) {
          await scheduleNotification(
            "📅 Check-in Tomorrow!",
            `Your reservation at ${room.hotel.name} is tomorrow. Don't forget to prepare!`,
            oneDayBefore,
            {
              bookingId: data.booking._id,
              hotelName: room.hotel.name,
            }
          );
        }

        const checkInMorning = new Date(checkInDate);
        checkInMorning.setHours(8, 0, 0, 0); // 8:00 AM

        if (checkInMorning > new Date()) {
          await scheduleNotification(
            "🏨 Check-in Today!",
            `Today is your check-in day at ${room.hotel.name}. Have a great stay!`,
            checkInMorning,
            {
              bookingId: data.booking._id,
              hotelName: room.hotel.name,
            }
          );
        }

        Alert.alert(
          "Success!", 
          "Booking created successfully! You will receive notifications about your reservation.",
          [
            { text: "OK", onPress: () => router.push("/(tabs)/my-bookings") },
          ]
        );
        setIsAvailable(false);
      } else {
        Alert.alert("Error", data.message || "Failed to create booking");
      }
    } catch (err) {
      if (err.response?.status === 401) {
        Alert.alert("Session Expired", "Please sign in again");
        router.push("/(auth)/sign-in");
        return;
      }

      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        "Failed to create booking. Please try again.";

      Alert.alert("Error", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (!room) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="px-6 py-4 flex-row items-center">
          <TouchableOpacity onPress={() => router.back()} className="mr-4">
            <Ionicons name="arrow-back" size={24} color="black" />
          </TouchableOpacity>
          <Text className="text-2xl font-bold flex-1" numberOfLines={1}>
            {room.hotel.name}
          </Text>
        </View>

        {/* Main Image */}
        <View className="px-6">
          <Image
            source={{ uri: mainImage }}
            className="w-full h-64 rounded-xl"
            resizeMode="cover"
          />
        </View>

        {/* Thumbnail Images */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="px-6 mt-4"
        >
          {room.images.map((image, index) => (
            <TouchableOpacity
              key={index}
              onPress={() => setMainImage(image)}
              className="mr-3"
            >
              <Image
                source={{ uri: image }}
                className={`w-20 h-20 rounded-lg ${
                  mainImage === image ? "border-2 border-blue-500" : ""
                }`}
                resizeMode="cover"
              />
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Room Info */}
        <View className="px-6 mt-6">
          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-lg text-gray-600">{room.roomType}</Text>
            <Text className="text-2xl font-bold text-blue-600">
              ${room.pricePerNight}
              <Text className="text-sm text-gray-500">/night</Text>
            </Text>
          </View>

          <View className="flex-row items-center mb-4">
            <Ionicons name="location" size={16} color="#6b7280" />
            <Text className="text-gray-600 ml-1">{room.hotel.address}</Text>
          </View>

          {/* Amenities */}
          <Text className="text-xl font-bold mb-3">Amenities</Text>
          <View className="flex-row flex-wrap gap-2 mb-6">
            {room.amenities &&
              room.amenities.map((amenity, index) => {
                const iconName = facilityIcons[amenity] || "checkmark-circle";

                return (
                  <View
                    key={index}
                    className="flex-row items-center bg-gray-100 px-3 py-2 rounded-lg"
                  >
                    <Ionicons name={iconName} size={16} color="#3b82f6" />
                    <Text className="ml-2 text-sm text-gray-700">
                      {amenity}
                    </Text>
                  </View>
                );
              })}
          </View>

          {/* Booking Form */}
          <View className="bg-gray-50 rounded-xl p-4 mb-6">
            <Text className="text-xl font-bold mb-4">Book Your Stay</Text>

            {/* Check-in Date */}
            <View className="mb-4">
              <Text className="text-sm font-semibold mb-2 text-gray-700">
                Check-in Date
              </Text>
              <TouchableOpacity
                onPress={() => setShowCheckIn(true)}
                disabled={!isSignedIn}
                className={`border border-gray-300 rounded-lg px-4 py-3 flex-row items-center justify-between ${
                  !isSignedIn ? "opacity-50" : ""
                }`}
              >
                <Text>{checkInDate.toLocaleDateString()}</Text>
                <Ionicons name="calendar" size={20} color="#3b82f6" />
              </TouchableOpacity>
              {showCheckIn && (
                <DateTimePicker
                  value={checkInDate}
                  mode="date"
                  minimumDate={new Date()}
                  onChange={(event, selectedDate) => {
                    setShowCheckIn(false);
                    if (selectedDate) {
                      setCheckInDate(selectedDate);
                      if (selectedDate >= checkOutDate) {
                        setCheckOutDate(
                          new Date(
                            selectedDate.getTime() + 2 * 24 * 60 * 60 * 1000
                          )
                        );
                      }
                      setIsAvailable(false);
                    }
                  }}
                />
              )}
            </View>

            {/* Check-out Date */}
            <View className="mb-4">
              <Text className="text-sm font-semibold mb-2 text-gray-700">
                Check-out Date
              </Text>
              <TouchableOpacity
                onPress={() => setShowCheckOut(true)}
                disabled={!isSignedIn}
                className={`border border-gray-300 rounded-lg px-4 py-3 flex-row items-center justify-between ${
                  !isSignedIn ? "opacity-50" : ""
                }`}
              >
                <Text>{checkOutDate.toLocaleDateString()}</Text>
                <Ionicons name="calendar" size={20} color="#3b82f6" />
              </TouchableOpacity>
              {showCheckOut && (
                <DateTimePicker
                  value={checkOutDate}
                  mode="date"
                  minimumDate={
                    new Date(checkInDate.getTime() + 24 * 60 * 60 * 1000)
                  }
                  onChange={(event, selectedDate) => {
                    setShowCheckOut(false);
                    if (selectedDate) {
                      setCheckOutDate(selectedDate);
                      setIsAvailable(false);
                    }
                  }}
                />
              )}
            </View>

            {/* Guests */}
            <View className="mb-4">
              <Text className="text-sm font-semibold mb-2 text-gray-700">
                Guests
              </Text>
              <View
                className={`flex-row items-center justify-between border border-gray-300 rounded-lg px-4 py-3 ${
                  !isSignedIn ? "opacity-50" : ""
                }`}
              >
                <TouchableOpacity
                  onPress={() => setGuests(Math.max(1, guests - 1))}
                  disabled={!isSignedIn}
                  className="w-8 h-8 bg-gray-200 rounded-full items-center justify-center"
                >
                  <Text className="text-lg font-bold">-</Text>
                </TouchableOpacity>
                <Text className="text-lg font-semibold">{guests}</Text>
                <TouchableOpacity
                  onPress={() => setGuests(Math.min(4, guests + 1))}
                  disabled={!isSignedIn}
                  className="w-8 h-8 bg-gray-200 rounded-full items-center justify-center"
                >
                  <Text className="text-lg font-bold">+</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Total Price */}
            <View className="bg-white rounded-lg p-4 mb-4">
              <View className="flex-row justify-between mb-2">
                <Text className="text-gray-600">
                  ${room.pricePerNight} × {nights} night{nights > 1 ? "s" : ""}{" "}
                  × {guests} guest{guests > 1 ? "s" : ""}
                </Text>
                <Text className="font-semibold">${totalPrice}</Text>
              </View>
              <View className="border-t border-gray-200 pt-2 flex-row justify-between">
                <Text className="text-lg font-bold">Total</Text>
                <Text className="text-lg font-bold text-blue-600">
                  ${totalPrice}
                </Text>
              </View>
            </View>

            {/* Sign In Notice o Book Button */}
            {!isSignedIn ? (
              <View className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                <Text className="text-yellow-800 text-center font-semibold">
                  ⚠️ Please sign in to book this room
                </Text>
                <TouchableOpacity
                  onPress={() => router.push("/(auth)/sign-in")}
                  className="bg-blue-600 py-3 rounded-lg items-center mt-3"
                >
                  <Text className="text-white font-bold">Sign In</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                onPress={handleBooking}
                disabled={loading}
                className={`bg-blue-600 py-4 rounded-lg items-center ${
                  loading ? "opacity-50" : ""
                }`}
              >
                {loading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text className="text-white font-bold text-lg">
                    {isAvailable ? "Book Now" : "Check Availability"}
                  </Text>
                )}
              </TouchableOpacity>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}