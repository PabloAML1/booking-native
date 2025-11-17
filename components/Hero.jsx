import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  ImageBackground,
  Animated,
  Platform,
  LayoutAnimation,
  UIManager,
  Easing,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import DateTimePicker from "@react-native-community/datetimepicker";
import { assets, cities } from "../assets/assets";

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const Hero = () => {
  const [form, setForm] = useState({
    destination: "",
    guests: 1,
  });

  const [checkInDate, setCheckInDate] = useState(new Date());
  const [checkOutDate, setCheckOutDate] = useState(new Date());
  const [showCheckInPicker, setShowCheckInPicker] = useState(false);
  const [showCheckOutPicker, setShowCheckOutPicker] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isExpanded) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        easing: Easing.ease,
        useNativeDriver: true,
      }).start();
    } else {
      fadeAnim.setValue(0);
    }
  }, [isExpanded]);

  const handleToggleForm = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsExpanded(!isExpanded);
  };

  const handleSearch = () => {
    const checkIn = checkInDate.toISOString().split("T")[0];
    const checkOut = checkOutDate.toISOString().split("T")[0];

    console.log({
      destination: form.destination,
      checkIn,
      checkOut,
      guests: form.guests,
    });
  };

  return (
    <ImageBackground
      source={require("../assets/heroImage.png")}
      className="flex-1 p-10"
      resizeMode="cover"
    >
      {/* Capa de sombra */}
      <View className="absolute inset-0 bg-black/40" />

      <View className="flex-1 px-6 justify-center">
        {/* Título centrado */}
        <Text className="text-white text-5xl font-bold text-center mb-3">
          Find and Book Your Perfect Stay
        </Text>
        <Text className="text-white text-center text-base opacity-90 mb-6">
          Discover and reserve your ideal accommodation in just a few clicks.
        Secure, fast, and convenient for both guests and property owners.
        </Text>

        {/* Formulario animado */}
        {isExpanded && (
          <Animated.View
            style={{
              opacity: fadeAnim,
              transform: [
                {
                  translateY: fadeAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-10, 0],
                  }),
                },
              ],
            }}
          >
            <View className="bg-white rounded-2xl p-5 mt-6 gap-4 shadow-lg">
              {/* Destino */}
              <View>
                <Text className="text-gray-700 font-semibold mb-2">Destination</Text>
                <View className="border border-gray-300 rounded-lg overflow-hidden">
                  <Picker
                    selectedValue={form.destination}
                    onValueChange={(value) =>
                      setForm({ ...form, destination: value })
                    }
                  >
                    <Picker.Item label="Select a city" value="" />
                    {cities.map((city, index) => (
                      <Picker.Item key={index} label={city} value={city} />
                    ))}
                  </Picker>
                </View>
              </View>

              {/* Fechas */}
              <View className="flex-row justify-between gap-3">
                <View className="flex-1">
                  <Text className="text-gray-700 font-semibold mb-2">Check-in</Text>
                  <TouchableOpacity
                    onPress={() => setShowCheckInPicker(true)}
                    className="border border-gray-300 rounded-lg px-3 py-3"
                  >
                    <Text className="text-gray-800">
                      {checkInDate.toLocaleDateString()}
                    </Text>
                  </TouchableOpacity>
                  {showCheckInPicker && (
                    <DateTimePicker
                      value={checkInDate}
                      mode="date"
                      display={Platform.OS === "ios" ? "spinner" : "default"}
                      onChange={(event, selectedDate) => {
                        setShowCheckInPicker(Platform.OS === "ios");
                        if (selectedDate) setCheckInDate(selectedDate);
                      }}
                      minimumDate={new Date()}
                    />
                  )}
                </View>

                <View className="flex-1">
                  <Text className="text-gray-700 font-semibold mb-2">Check-out</Text>
                  <TouchableOpacity
                    onPress={() => setShowCheckOutPicker(true)}
                    className="border border-gray-300 rounded-lg px-3 py-3"
                  >
                    <Text className="text-gray-800">
                      {checkOutDate.toLocaleDateString()}
                    </Text>
                  </TouchableOpacity>
                  {showCheckOutPicker && (
                    <DateTimePicker
                      value={checkOutDate}
                      mode="date"
                      display={Platform.OS === "ios" ? "spinner" : "default"}
                      onChange={(event, selectedDate) => {
                        setShowCheckOutPicker(Platform.OS === "ios");
                        if (selectedDate) setCheckOutDate(selectedDate);
                      }}
                      minimumDate={checkInDate}
                    />
                  )}
                </View>
              </View>

              {/* Guests */}
              <View>
                <Text className="text-gray-700 font-semibold mb-2">Guests</Text>
                <TextInput
                  className="border border-gray-300 rounded-lg px-3 py-3 text-gray-800"
                  keyboardType="numeric"
                  value={String(form.guests)}
                  onChangeText={(value) => {
                    const num = parseInt(value) || 1;
                    setForm({ ...form, guests: Math.min(Math.max(num, 1), 4) });
                  }}
                />
              </View>

              {/* Botón de búsqueda */}
              <TouchableOpacity
                onPress={handleSearch}
                className="bg-black rounded-full py-4 flex-row items-center justify-center mt-2"
              >
                <Image
                  source={assets.searchIcon}
                  className="h-5 w-5 mr-2"
                  resizeMode="contain"
                />
                <Text className="text-white font-semibold text-lg">Search</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        )}
      </View>
    </ImageBackground>
  );
};

export default Hero;
