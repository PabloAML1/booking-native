import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Platform,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useRouter } from "expo-router";

const cities = ["New York", "London", "Paris", "Tokyo", "Barcelona"];

const SearchBar = ({
  initialDestination = "",
  initialCheckIn = null,
  initialCheckOut = null,
  initialGuests = 1,
}) => {
  const router = useRouter();
  const [form, setForm] = useState({
    destination: initialDestination || "All",
    guests: initialGuests,
  });

  const [checkIn, setCheckIn] = useState(initialCheckIn || new Date());
  const [checkOut, setCheckOut] = useState(initialCheckOut || new Date());
  const [showCheckInPicker, setShowCheckInPicker] = useState(false);
  const [showCheckOutPicker, setShowCheckOutPicker] = useState(false);

  const handleSearch = () => {
    const destParam = form.destination === "All" ? "" : form.destination;
    const checkInStr = checkIn.toISOString().split("T")[0];
    const checkOutStr = checkOut.toISOString().split("T")[0];

    router.push(
      `/rooms?destination=${destParam}&checkIn=${checkInStr}&checkOut=${checkOutStr}&guests=${form.guests}`
    );
  };

  const handleClearFilters = () => {
    setForm({ destination: "All", guests: 1 });
    setCheckIn(new Date());
    setCheckOut(new Date());
    router.push("/rooms");
  };

  return (
    <View className="bg-gray-50 rounded-lg p-4 mt-4 gap-3">
      {/* Destination */}
      <View>
        <Text className="text-gray-600 text-sm mb-1">📍 Destination</Text>
        <View className="border border-gray-300 rounded-lg overflow-hidden">
          <Picker
            selectedValue={form.destination}
            onValueChange={(value) => setForm({ ...form, destination: value })}
          >
            <Picker.Item label="All Cities" value="All" />
            {cities.map((city, index) => (
              <Picker.Item key={index} label={city} value={city} />
            ))}
          </Picker>
        </View>
      </View>

      {/* Dates */}
      <View className="flex-row gap-3">
        <View className="flex-1">
          <Text className="text-gray-600 text-sm mb-1">📅 Check-in</Text>
          <TouchableOpacity
            onPress={() => setShowCheckInPicker(true)}
            className="border border-gray-300 rounded-lg px-3 py-2"
          >
            <Text>{checkIn.toLocaleDateString()}</Text>
          </TouchableOpacity>
          {showCheckInPicker && (
            <DateTimePicker
              value={checkIn}
              mode="date"
              display={Platform.OS === "ios" ? "spinner" : "default"}
              onChange={(event, date) => {
                setShowCheckInPicker(Platform.OS === "ios");
                if (date) setCheckIn(date);
              }}
              minimumDate={new Date()}
            />
          )}
        </View>

        <View className="flex-1">
          <Text className="text-gray-600 text-sm mb-1">📅 Check-out</Text>
          <TouchableOpacity
            onPress={() => setShowCheckOutPicker(true)}
            className="border border-gray-300 rounded-lg px-3 py-2"
          >
            <Text>{checkOut.toLocaleDateString()}</Text>
          </TouchableOpacity>
          {showCheckOutPicker && (
            <DateTimePicker
              value={checkOut}
              mode="date"
              display={Platform.OS === "ios" ? "spinner" : "default"}
              onChange={(event, date) => {
                setShowCheckOutPicker(Platform.OS === "ios");
                if (date) setCheckOut(date);
              }}
              minimumDate={checkIn}
            />
          )}
        </View>
      </View>

      {/* Guests */}
      <View>
        <Text className="text-gray-600 text-sm mb-1">👥 Guests</Text>
        <TextInput
          className="border border-gray-300 rounded-lg px-3 py-2"
          keyboardType="numeric"
          value={String(form.guests)}
          onChangeText={(value) => {
            const num = parseInt(value) || 1;
            setForm({ ...form, guests: Math.min(Math.max(num, 1), 4) });
          }}
        />
      </View>

      {/* Buttons */}
      <View className="flex-row gap-3 mt-2">
        <TouchableOpacity
          onPress={handleSearch}
          className="flex-1 bg-black rounded-lg py-3 items-center"
        >
          <Text className="text-white font-medium">🔍 Search</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleClearFilters}
          className="flex-1 bg-gray-300 rounded-lg py-3 items-center"
        >
          <Text className="text-gray-700 font-medium">Clear</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default SearchBar;