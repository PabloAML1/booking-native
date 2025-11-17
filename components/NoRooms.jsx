import React from "react";
import { View, Text } from "react-native";

const NoRooms = () => (
  <View className="flex items-center justify-center py-20">
    <Text className="text-6xl mb-4">😔</Text>
    <Text className="text-lg font-semibold text-gray-700">We're sorry</Text>
    <Text className="text-sm text-gray-500 text-center mt-2">
      There are no rooms available with those filters.
    </Text>
  </View>
);

export default NoRooms;