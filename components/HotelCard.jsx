import { View, Text, Image, TouchableOpacity } from "react-native";
import React from "react";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

const HotelCard = ({ room, index }) => {
  const router = useRouter();

  const handlePress = () => {
    router.push(`/rooms/${room._id}`);
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      className="flex-1 bg-white rounded-xl shadow-sm overflow-hidden"
      activeOpacity={0.7}
    >
      <Image
        source={{ uri: room.images[0] }}
        className="w-full h-32"
        resizeMode="cover"
      />
      <View className="p-3">
        <Text className="font-bold text-sm mb-1" numberOfLines={1}>
          {room.hotel.name}
        </Text>
        <Text className="text-xs text-gray-500 mb-2" numberOfLines={1}>
          {room.roomType}
        </Text>
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center">
            <Ionicons name="location" size={12} color="#6b7280" />
            <Text className="text-xs text-gray-500 ml-1" numberOfLines={1}>
              {room.hotel.address}
            </Text>
          </View>
        </View>
        <View className="flex-row items-center justify-between mt-2">
          <Text className="text-blue-600 font-bold text-base">
            ${room.pricePerNight}
            <Text className="text-xs text-gray-500">/night</Text>
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default HotelCard;