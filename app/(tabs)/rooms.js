import React from "react";
import { View, Text, FlatList } from "react-native";
import { useAppContext } from "../../context/AppContext";
import HotelCard from "../../components/HotelCard";

export default function Rooms() {
  const { rooms } = useAppContext();

  return (
    <View className="flex-1 bg-white pt-20">
      <View className="px-6 py-4">
        <Text className="text-3xl font-bold mb-4">All Rooms</Text>
      </View>
      <FlatList
        data={rooms}
        keyExtractor={(item) => item._id}
        numColumns={2}
        columnWrapperStyle={{ justifyContent: "space-between", gap: 16 }}
        contentContainerStyle={{ gap: 16, paddingBottom: 20, paddingHorizontal: 24 }}
        renderItem={({ item, index }) => (
          <HotelCard room={item} index={index} />
        )}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}