import React, { useState, useEffect, useMemo } from "react";
import { View, FlatList } from "react-native";
import HotelCard from "./HotelCard";
import Title from "./Title";
// import { useAppContext } from "../hooks/useAppContext";

const RecommendedHotels = () => {
  // const { rooms, searchedCities } = useAppContext();
  
  // Datos de ejemplo mientras configuras el context
  const mockRooms = useMemo(() => [
    {
      _id: "1",
      hotel: {
        name: "Hotel Paradise",
        city: "New York",
        image: "https://via.placeholder.com/300",
        rating: 4.5,
      },
      price: 150,
    },
    {
      _id: "2",
      hotel: {
        name: "Grand Hotel",
        city: "London",
        image: "https://via.placeholder.com/300",
        rating: 4.8,
      },
      price: 200,
    },
    {
      _id: "3",
      hotel: {
        name: "Beach Resort",
        city: "Barcelona",
        image: "https://via.placeholder.com/300",
        rating: 4.7,
      },
      price: 180,
    },
    {
      _id: "4",
      hotel: {
        name: "Mountain Lodge",
        city: "Paris",
        image: "https://via.placeholder.com/300",
        rating: 4.6,
      },
      price: 160,
    },
  ], []);

  const searchedCities = useMemo(() => ["New York", "London"], []);

  const recommended = useMemo(() => {
    return mockRooms
      .filter((room) => searchedCities.includes(room.hotel.city))
      .slice(0, 4);
  }, [mockRooms, searchedCities]);

  if (recommended.length === 0) return null;

  return (
    <View className="mt-10 px-6 bg-slate-50 pb-6">
      <Title
        title="Recommended Properties"
        subTitle="Discover our handpicked selection of exceptional properties, offering memorable stays and unique experiences."
      />

      <FlatList
        data={recommended}
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

export default RecommendedHotels;