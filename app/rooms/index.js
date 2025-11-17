import React, { useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  Modal,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import SearchBar from "../../components/SearchBar";
import NoRooms from "../../components/NoRooms";
import FilterModal from "../../components/FilterModal";

const facilityIcons = {
  WiFi: "📶",
  TV: "📺",
  "Air Conditioning": "❄️",
  Parking: "🅿️",
  Pool: "🏊",
  Gym: "💪",
  // Agrega más según tus necesidades
};

const Rooms = () => {
  const params = useLocalSearchParams();
  const router = useRouter();
  const [showFilters, setShowFilters] = useState(false);

  // Mock rooms data - reemplaza con tu context
  const mockRooms = useMemo(
    () => [
      {
        _id: "1",
        hotel: {
          name: "Hotel Paradise",
          city: "New York",
          address: "123 Main St, New York",
        },
        images: ["https://via.placeholder.com/400"],
        roomType: "Double Bed",
        pricePerNight: 150,
        amenities: ["WiFi", "TV", "Air Conditioning"],
        createdAt: "2024-01-01",
      },
      {
        _id: "2",
        hotel: {
          name: "Grand Hotel",
          city: "London",
          address: "456 Oxford St, London",
        },
        images: ["https://via.placeholder.com/400"],
        roomType: "Luxury Room",
        pricePerNight: 250,
        amenities: ["WiFi", "TV", "Pool", "Gym"],
        createdAt: "2024-01-15",
      },
    ],
    []
  );

  const [selectedFilters, setSelectedFilters] = useState({
    roomType: [],
    priceRange: [],
  });
  const [selectedSort, setSelectedSort] = useState("");

  const guests = Number(params.guests || 1);
  const checkInStr = params.checkIn;
  const checkOutStr = params.checkOut;

  const checkIn = checkInStr ? new Date(checkInStr) : null;
  const checkOut = checkOutStr ? new Date(checkOutStr) : null;

  // Calcular noches
  let nights = 1;
  if (checkIn && checkOut) {
    const diffTime = Math.abs(checkOut - checkIn);
    nights = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  // Funciones de filtrado
  const matchesRoomType = useCallback(
    (room) => {
      return (
        selectedFilters.roomType.length === 0 ||
        selectedFilters.roomType.includes(room.roomType)
      );
    },
    [selectedFilters.roomType]
  );

  const matchesPriceRange = useCallback(
    (room) => {
      const totalPrice = room.pricePerNight * nights * guests;
      return (
        selectedFilters.priceRange.length === 0 ||
        selectedFilters.priceRange.some((range) => {
          if (range.includes("+")) {
            const min = Number(range.replace("+", ""));
            return totalPrice >= min;
          } else {
            const [min, max] = range.split(" to ").map(Number);
            return totalPrice >= min && totalPrice <= max;
          }
        })
      );
    },
    [guests, nights, selectedFilters.priceRange]
  );

  const filterDestination = useCallback(
    (room) => {
      const destination = params.destination;
      if (!destination) return true;
      return room.hotel.city.toLowerCase().includes(destination.toLowerCase());
    },
    [params.destination]
  );

  const sortRooms = useCallback(
    (a, b) => {
      if (selectedSort === "Price Low to High") {
        return a.pricePerNight - b.pricePerNight;
      } else if (selectedSort === "Price High to Low") {
        return b.pricePerNight - a.pricePerNight;
      } else if (selectedSort === "Newest First") {
        return new Date(b.createdAt) - new Date(a.createdAt);
      }
      return 0;
    },
    [selectedSort]
  );

  const filteredRooms = useMemo(() => {
    return mockRooms
      .filter(
        (room) =>
          matchesRoomType(room) &&
          matchesPriceRange(room) &&
          filterDestination(room)
      )
      .sort(sortRooms);
  }, [
    mockRooms,
    sortRooms,
    matchesRoomType,
    matchesPriceRange,
    filterDestination,
  ]);

  const clearFilters = () => {
    setSelectedFilters({ roomType: [], priceRange: [] });
    setSelectedSort("");
  };

  const handleRoomPress = (roomId) => {
    const queryParams = new URLSearchParams({
      destination: params.destination || "",
      checkIn: checkInStr || "",
      checkOut: checkOutStr || "",
      guests: guests.toString(),
    }).toString();

    router.push(`/rooms/${roomId}?${queryParams}`);
  };

  return (
    <ScrollView className="flex-1 bg-white">
      <View className="px-6 pt-6">
        {/* Header */}
        <Text className="text-4xl font-bold text-gray-800">Rooms</Text>
        <Text className="text-sm text-gray-500 mt-2">
          Enjoy a comfortable stay with exceptional service and thoughtful
          amenities designed to make your experience memorable.
        </Text>

        {/* SearchBar */}
        <SearchBar
          initialDestination={params.destination || ""}
          initialCheckIn={checkIn}
          initialCheckOut={checkOut}
          initialGuests={guests}
        />

        {/* Filter Button */}
        <TouchableOpacity
          onPress={() => setShowFilters(true)}
          className="bg-gray-800 rounded-lg py-3 px-6 mt-4 flex-row items-center justify-center"
        >
          <Text className="text-white font-medium mr-2">🔍 Filters & Sort</Text>
          {(selectedFilters.roomType.length > 0 ||
            selectedFilters.priceRange.length > 0 ||
            selectedSort) && (
            <View className="bg-red-500 rounded-full w-5 h-5 items-center justify-center">
              <Text className="text-white text-xs">
                {selectedFilters.roomType.length +
                  selectedFilters.priceRange.length +
                  (selectedSort ? 1 : 0)}
              </Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Rooms List */}
        {filteredRooms.length === 0 ? (
          <NoRooms />
        ) : (
          filteredRooms.map((room) => (
            <View
              key={room._id}
              className="py-6 border-b border-gray-200"
            >
              {/* Room Image */}
              <TouchableOpacity
                onPress={() => handleRoomPress(room._id)}
                activeOpacity={0.8}
              >
                <Image
                  source={{ uri: room.images[0] }}
                  className="w-full h-48 rounded-xl"
                  resizeMode="cover"
                />
              </TouchableOpacity>

              {/* Room Info */}
              <View className="mt-4">
                <Text className="text-gray-600 text-sm">{room.hotel.city}</Text>
                <TouchableOpacity onPress={() => handleRoomPress(room._id)}>
                  <Text className="text-gray-800 text-2xl font-bold mt-1">
                    {room.hotel.name}
                  </Text>
                </TouchableOpacity>

                <View className="flex-row items-center mt-2">
                  <Text className="text-gray-500 text-sm">
                    📍 {room.hotel.address}
                  </Text>
                </View>

                {/* Amenities */}
                <View className="flex-row flex-wrap gap-2 mt-3">
                  {room.amenities.map((amenity, index) => (
                    <View
                      key={index}
                      className="bg-blue-50 px-3 py-2 rounded-lg flex-row items-center"
                    >
                      <Text className="text-xs mr-1">
                        {facilityIcons[amenity] || "✨"}
                      </Text>
                      <Text className="text-xs text-gray-700">{amenity}</Text>
                    </View>
                  ))}
                </View>

                {/* Price */}
                <Text className="text-xl font-semibold text-gray-800 mt-4">
                  ${room.pricePerNight * nights * guests} total
                </Text>
                <Text className="text-sm text-gray-500">
                  ({guests} guest{guests > 1 ? "s" : ""} • {nights} night
                  {nights > 1 ? "s" : ""})
                </Text>
              </View>
            </View>
          ))
        )}
      </View>

      {/* Filter Modal */}
      <FilterModal
        visible={showFilters}
        onClose={() => setShowFilters(false)}
        selectedFilters={selectedFilters}
        setSelectedFilters={setSelectedFilters}
        selectedSort={selectedSort}
        setSelectedSort={setSelectedSort}
        onClearFilters={clearFilters}
      />
    </ScrollView>
  );
};

export default Rooms;