import React from "react";
import { View, FlatList, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import HotelCard from "./HotelCard";
import Title from "./Title";
import { useAppContext } from "../context/AppContext";

const FeaturedDestination = () => {
  const { rooms, loading } = useAppContext();
  const router = useRouter();

  if (loading) {
    return (
      <View className="mt-10 px-6 py-20 items-center">
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  if (!rooms || rooms.length === 0) return null;

  return (
    <View className="mt-5 px-6 bg-white pb-6">
      <Title
        title="Featured Destination"
        subTitle="Discover our handpicked section of exceptional properties, offering unparalleled luxury and unforgettable experiences."
      />

      <FlatList
        data={rooms.slice(0, 4)}
        keyExtractor={(item) => item._id}
        numColumns={2}
        columnWrapperStyle={{ justifyContent: "space-between", gap: 16 }}
        contentContainerStyle={{ marginTop: 40, gap: 16 }}
        renderItem={({ item, index }) => (
          <HotelCard room={item} index={index} />
        )}
        scrollEnabled={false}
      />
    </View>
  );
};

export default FeaturedDestination;