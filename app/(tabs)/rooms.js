import React, { useState, useMemo, useCallback } from "react";
import { View, Text, FlatList, TouchableOpacity, TextInput, Platform, Modal, ScrollView, Alert } from "react-native";
import { useAppContext } from "../../context/AppContext";
import HotelCard from "../../components/HotelCard";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from '@react-native-community/datetimepicker';
import api from "../../api/index.js";

export default function Rooms() {
  const { rooms } = useAppContext();
  const [selectedFilters, setSelectedFilters] = useState({
    roomType: [],
    priceRange: [],
  });
  const [selectedSort, setSelectedSort] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  
  const [checkInDate, setCheckInDate] = useState(null);
  const [checkOutDate, setCheckOutDate] = useState(null);
  const [showCheckInPicker, setShowCheckInPicker] = useState(false);
  const [showCheckOutPicker, setShowCheckOutPicker] = useState(false);
  
  const [availableRoomIds, setAvailableRoomIds] = useState([]);
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  
  const [showFiltersModal, setShowFiltersModal] = useState(false);
  
  const [expandedSections, setExpandedSections] = useState({
    roomType: false,
    priceRange: false,
    sortBy: false,
    dates: false,
  });

  const roomTypes = ["Single Bed", "Double Bed", "Luxury Room", "Family Suite"];
  const priceRanges = ["0-100", "100-200", "200-300", "300+"];
  const sortOptions = ["Price Low to High", "Price High to Low"];

  const activeFiltersCount = 
    selectedFilters.roomType.length + 
    selectedFilters.priceRange.length + 
    (selectedSort ? 1 : 0) + 
    (checkInDate && checkOutDate ? 1 : 0);

  const toggleSection = (section) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const handleFilterChange = (value, type) => {
    setSelectedFilters((prevFilters) => {
      const updatedFilters = { ...prevFilters };
      if (updatedFilters[type].includes(value)) {
        updatedFilters[type] = updatedFilters[type].filter((item) => item !== value);
      } else {
        updatedFilters[type] = [...updatedFilters[type], value];
      }
      return updatedFilters;
    });
  };

  const handleSortChange = (sortOption) => {
    setSelectedSort(selectedSort === sortOption ? "" : sortOption);
  };

  // 🔥 Función para verificar disponibilidad de todas las habitaciones
  const checkRoomsAvailability = async (startDate, endDate) => {
    if (!startDate || !endDate) {
      setAvailableRoomIds([]);
      return;
    }

    setCheckingAvailability(true);

    try {
      // Verificar disponibilidad de cada habitación
      const availabilityChecks = rooms.map(async (room) => {
        try {
          const { data } = await api.post("/api/bookings/check-availability", {
            room: room._id,
            dateRange: [
              {
                startDate: startDate.toISOString(),
                endDate: endDate.toISOString(),
              },
            ],
          });

          return {
            roomId: room._id,
            isAvailable: data.success && data.isAvailable,
          };
        } catch (error) {
          console.error(`Error checking availability for room ${room._id}:`, error);
          return {
            roomId: room._id,
            isAvailable: false,
          };
        }
      });

      const results = await Promise.all(availabilityChecks);

      // Filtrar solo habitaciones disponibles
      const available = results
        .filter((result) => result.isAvailable)
        .map((result) => result.roomId);

      setAvailableRoomIds(available);

    } catch (error) {
      console.error("Error checking availability:", error);
      Alert.alert("Error", "Failed to check room availability");
    } finally {
      setCheckingAvailability(false);
    }
  };

  const onCheckInChange = (event, selectedDate) => {
    setShowCheckInPicker(Platform.OS === 'ios');
    if (selectedDate) {
      setCheckInDate(selectedDate);
      if (checkOutDate && selectedDate >= checkOutDate) {
        setCheckOutDate(null);
        setAvailableRoomIds([]);
      } else if (checkOutDate) {
        checkRoomsAvailability(selectedDate, checkOutDate);
      }
    }
  };

  const onCheckOutChange = (event, selectedDate) => {
    setShowCheckOutPicker(Platform.OS === 'ios');
    if (selectedDate && checkInDate) {
      setCheckOutDate(selectedDate);
      checkRoomsAvailability(checkInDate, selectedDate);
    }
  };

  const clearDates = () => {
    setCheckInDate(null);
    setCheckOutDate(null);
    setAvailableRoomIds([]);
  };

  const formatDate = (date) => {
    if (!date) return "";
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
  };

  const matchesRoomType = useCallback((room) => {
    return (
      selectedFilters.roomType.length === 0 ||
      selectedFilters.roomType.includes(room.roomType)
    );
  }, [selectedFilters.roomType]);

  const matchesPriceRange = useCallback((room) => {
    if (selectedFilters.priceRange.length === 0) return true;

    const price = room.pricePerNight || room.price || 0;

    return selectedFilters.priceRange.some((range) => {
      if (range === "0-100") {
        return price < 100;
      } else if (range === "100-200") {
        return price >= 100 && price <= 200;
      } else if (range === "200-300") {
        return price >= 200 && price <= 300;
      } else if (range === "300+") {
        return price > 300;
      }
      return false;
    });
  }, [selectedFilters.priceRange]);

  const matchesSearchQuery = useCallback((room) => {
    if (!searchQuery.trim()) return true;
    
    const query = searchQuery.toLowerCase();
    const hotelName = room.hotel?.name?.toLowerCase() || "";
    const city = room.hotel?.city?.toLowerCase() || "";
    const roomType = room.roomType?.toLowerCase() || "";
    const address = room.hotel?.address?.toLowerCase() || "";
    
    return hotelName.includes(query) || city.includes(query) || roomType.includes(query) || address.includes(query);
  }, [searchQuery]);

  const matchesDateRange = useCallback((room) => {
    if (!checkInDate || !checkOutDate) return true;
    
    return availableRoomIds.includes(room._id);
  }, [checkInDate, checkOutDate, availableRoomIds]);

  const sortRooms = useCallback((a, b) => {
    if (selectedSort === "Price Low to High") {
      const priceA = a.pricePerNight || a.price || 0;
      const priceB = b.pricePerNight || b.price || 0;
      return priceA - priceB;
    } else if (selectedSort === "Price High to Low") {
      const priceA = a.pricePerNight || a.price || 0;
      const priceB = b.pricePerNight || b.price || 0;
      return priceB - priceA;
    }
    return 0;
  }, [selectedSort]);

  const filteredRooms = useMemo(() => {
    return rooms
      .filter((room) => 
        matchesRoomType(room) && 
        matchesPriceRange(room) && 
        matchesSearchQuery(room) &&
        matchesDateRange(room)
      )
      .sort(sortRooms);
  }, [rooms, matchesRoomType, matchesPriceRange, matchesSearchQuery, matchesDateRange, sortRooms]);

  const clearFilters = () => {
    setSelectedFilters({ roomType: [], priceRange: [] });
    setSelectedSort("");
    setSearchQuery("");
    clearDates();
  };

  const FilterButton = ({ label, value, type, isSort = false }) => {
    const isSelected = isSort
      ? selectedSort === value
      : type === "roomType"
      ? selectedFilters.roomType.includes(value)
      : selectedFilters.priceRange.includes(value);

    return (
      <TouchableOpacity
        onPress={() => (isSort ? handleSortChange(value) : handleFilterChange(value, type))}
        className={`px-4 py-2 rounded-full mr-2 mb-2 ${
          isSelected ? "bg-blue-500" : "bg-gray-200"
        }`}
      >
        <Text className={isSelected ? "text-white font-semibold" : "text-gray-700"}>
          {label}
        </Text>
      </TouchableOpacity>
    );
  };

  const CollapsibleSection = ({ title, section, children, count = 0 }) => {
    const isExpanded = expandedSections[section];
    
    return (
      <View className="mb-2 border-b border-gray-200 pb-2">
        <TouchableOpacity
          onPress={() => toggleSection(section)}
          className="flex-row justify-between items-center py-2"
        >
          <View className="flex-row items-center">
            <Text className="text-sm font-semibold text-gray-700">{title}</Text>
            {count > 0 && (
              <View className="ml-2 bg-blue-500 rounded-full px-2 py-0.5">
                <Text className="text-white text-xs font-bold">{count}</Text>
              </View>
            )}
          </View>
          <Ionicons 
            name={isExpanded ? "chevron-up" : "chevron-down"} 
            size={20} 
            color="#666" 
          />
        </TouchableOpacity>
        
        {isExpanded && (
          <View className="mt-2">
            {children}
          </View>
        )}
      </View>
    );
  };

  return (
    <View className="flex-1 bg-white pb-4">
      <View className="px-6 py-9">
        <View className="flex-row justify-between items-center mb-4">
          <Text className="text-3xl font-bold">All Rooms</Text>
          
          {/* Botón de Filtros */}
          <TouchableOpacity 
            onPress={() => setShowFiltersModal(true)} 
            className="bg-blue-500 px-4 py-2 rounded-full flex-row items-center"
          >
            <Ionicons name="options-outline" size={18} color="white" />
            <Text className="text-white font-semibold text-xs ml-2">
              FILTERS {activeFiltersCount > 0 && `(${activeFiltersCount})`}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Buscador */}
        <View className="mb-4 flex-row items-center bg-gray-100 rounded-full px-4 py-3">
          <Ionicons name="search" size={20} color="#666" />
          <TextInput
            className="flex-1 ml-2 text-base"
            placeholder="Search by hotel name, city or room type..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#999"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Ionicons name="close-circle" size={20} color="#666" />
            </TouchableOpacity>
          )}
        </View>

        {/* Indicador de verificación de disponibilidad */}
        {checkingAvailability && (
          <View className="mb-3 flex-row items-center bg-blue-50 rounded-lg px-4 py-3">
            <Ionicons name="sync" size={18} color="#3b82f6" />
            <Text className="text-blue-600 text-sm ml-2 font-medium">
              Checking availability...
            </Text>
          </View>
        )}

        {/* Mensaje cuando hay fechas seleccionadas */}
        {checkInDate && checkOutDate && !checkingAvailability && (
          <View className="mb-3 flex-row items-center bg-green-50 rounded-lg px-4 py-3">
            <Ionicons name="checkmark-circle" size={18} color="#22c55e" />
            <Text className="text-green-700 text-sm ml-2 font-medium">
              Showing {availableRoomIds.length} available room(s) for selected dates
            </Text>
          </View>
        )}

        <Text className="text-sm text-gray-500 mb-2">
          {filteredRooms.length} room(s) found
        </Text>
      </View>

      {/* Modal de Filtros */}
      <Modal
        visible={showFiltersModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowFiltersModal(false)}
      >
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-white rounded-t-3xl max-h-[85%]">
            {/* Header del Modal */}
            <View className="flex-row justify-between items-center px-6 py-4 border-b border-gray-200">
              <Text className="text-xl font-bold">Filters</Text>
              <TouchableOpacity onPress={() => setShowFiltersModal(false)}>
                <Ionicons name="close" size={28} color="#333" />
              </TouchableOpacity>
            </View>

            {/* Contenido de Filtros */}
            <ScrollView className="px-6 py-4">
              {/* Filtro de Fechas */}
              <CollapsibleSection 
                title="Date Range" 
                section="dates"
                count={checkInDate && checkOutDate ? 1 : 0}
              >
                <View className="w-full">
                  <TouchableOpacity
                    onPress={() => setShowCheckInPicker(true)}
                    className="flex-row items-center justify-between bg-white rounded-lg px-4 py-3 mb-3 border border-gray-300"
                  >
                    <View className="flex-row items-center">
                      <Ionicons name="calendar-outline" size={20} color="#666" />
                      <Text className="ml-2 text-gray-700">
                        Check-in: {checkInDate ? formatDate(checkInDate) : "Select date"}
                      </Text>
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => checkInDate && setShowCheckOutPicker(true)}
                    disabled={!checkInDate}
                    className={`flex-row items-center justify-between bg-white rounded-lg px-4 py-3 mb-3 border border-gray-300 ${
                      !checkInDate ? "opacity-50" : ""
                    }`}
                  >
                    <View className="flex-row items-center">
                      <Ionicons name="calendar-outline" size={20} color="#666" />
                      <Text className="ml-2 text-gray-700">
                        Check-out: {checkOutDate ? formatDate(checkOutDate) : "Select date"}
                      </Text>
                    </View>
                  </TouchableOpacity>

                  {/* Indicador de disponibilidad en el modal */}
                  {checkingAvailability && (
                    <View className="mb-3 flex-row items-center justify-center bg-blue-50 rounded-lg px-4 py-3">
                      <Ionicons name="sync" size={18} color="#3b82f6" />
                      <Text className="text-blue-600 text-sm ml-2">
                        Checking availability...
                      </Text>
                    </View>
                  )}

                  {checkInDate && checkOutDate && !checkingAvailability && (
                    <View className="mb-3 bg-green-50 rounded-lg px-4 py-3">
                      <Text className="text-green-700 text-sm text-center font-medium">
                        ✓ {availableRoomIds.length} room(s) available
                      </Text>
                    </View>
                  )}

                  {(checkInDate || checkOutDate) && (
                    <TouchableOpacity
                      onPress={clearDates}
                      className="bg-red-100 rounded-lg px-4 py-2"
                    >
                      <Text className="text-red-600 text-center font-semibold">Clear Dates</Text>
                    </TouchableOpacity>
                  )}

                  {showCheckInPicker && (
                    <DateTimePicker
                      value={checkInDate || new Date()}
                      mode="date"
                      display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                      onChange={onCheckInChange}
                      minimumDate={new Date()}
                    />
                  )}

                  {showCheckOutPicker && (
                    <DateTimePicker
                      value={checkOutDate || new Date()}
                      mode="date"
                      display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                      onChange={onCheckOutChange}
                      minimumDate={checkInDate || new Date()}
                    />
                  )}
                </View>
              </CollapsibleSection>

              <CollapsibleSection 
                title="Room Type" 
                section="roomType"
                count={selectedFilters.roomType.length}
              >
                <View className="flex-row flex-wrap">
                  {roomTypes.map((type) => (
                    <FilterButton
                      key={type}
                      label={type}
                      value={type}
                      type="roomType"
                    />
                  ))}
                </View>
              </CollapsibleSection>

              <CollapsibleSection 
                title="Price Range" 
                section="priceRange"
                count={selectedFilters.priceRange.length}
              >
                <View className="flex-row flex-wrap">
                  {priceRanges.map((range) => (
                    <FilterButton
                      key={range}
                      label={range === "300+" ? "> $300" : `$${range.replace("-", " - $")}`}
                      value={range}
                      type="priceRange"
                    />
                  ))}
                </View>
              </CollapsibleSection>

              <CollapsibleSection 
                title="Sort By" 
                section="sortBy"
                count={selectedSort ? 1 : 0}
              >
                <View className="flex-row flex-wrap">
                  {sortOptions.map((option) => (
                    <FilterButton
                      key={option}
                      label={option}
                      value={option}
                      isSort={true}
                    />
                  ))}
                </View>
              </CollapsibleSection>
            </ScrollView>

            {/* Footer del Modal */}
            <View className="flex-row gap-3 px-6 py-4 border-t border-gray-200">
              <TouchableOpacity 
                onPress={clearFilters}
                className="flex-1 bg-gray-200 py-3 rounded-full"
              >
                <Text className="text-gray-700 font-semibold text-center">Clear All</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={() => setShowFiltersModal(false)}
                className="flex-1 bg-blue-500 py-3 rounded-full"
              >
                <Text className="text-white font-semibold text-center">
                  Apply Filters ({filteredRooms.length})
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <FlatList
        data={filteredRooms}
        keyExtractor={(item) => item._id}
        numColumns={2}
        columnWrapperStyle={{ justifyContent: "space-between", gap: 16 }}
        contentContainerStyle={{ gap: 16, paddingBottom: 100, paddingHorizontal: 24 }}
        renderItem={({ item, index }) => (
          <HotelCard room={item} index={index} />
        )}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}