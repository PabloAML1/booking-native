import React from "react";
import { View, Text, TouchableOpacity, ImageBackground } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

export default function Welcome() {
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1">
      <ImageBackground
        source={require("../../assets/heroImage.png")}
        className="flex-1"
        resizeMode="cover"
      >
        <View className="absolute inset-0 bg-black/50" />

        <View className="flex-1 px-6 justify-between py-12">
          {/* Logo y Título Superior */}
          <View className="items-center mt-8">
            <View className="bg-white/20 rounded-full p-4 mb-4">
              <Text className="text-6xl">🏨</Text>
            </View>
            <Text className="text-white text-4xl font-bold text-center">
              Booking Native
            </Text>
            <Text className="text-white/90 text-base text-center mt-3 px-4">
              Your perfect stay is just one tap away
            </Text>
          </View>

          {/* Features */}
          <View className="gap-3">
            <View className="flex-row items-center bg-white/10 backdrop-blur-lg rounded-2xl px-5 py-4 border border-white/20">
              <View className="bg-white/20 rounded-full p-2 mr-3">
                <Ionicons name="search" size={22} color="white" />
              </View>
              <Text className="text-white text-base font-medium">
                Discover amazing places
              </Text>
            </View>

            <View className="flex-row items-center bg-white/10 backdrop-blur-lg rounded-2xl px-5 py-4 border border-white/20">
              <View className="bg-white/20 rounded-full p-2 mr-3">
                <Ionicons name="calendar" size={22} color="white" />
              </View>
              <Text className="text-white text-base font-medium">
                Book in seconds
              </Text>
            </View>

            <View className="flex-row items-center bg-white/10 backdrop-blur-lg rounded-2xl px-5 py-4 border border-white/20">
              <View className="bg-white/20 rounded-full p-2 mr-3">
                <Ionicons name="shield-checkmark" size={22} color="white" />
              </View>
              <Text className="text-white text-base font-medium">
                Secure & reliable
              </Text>
            </View>
          </View>

          {/* Botones de acción */}
          <View className="gap-4 pb-6">
            <TouchableOpacity
              onPress={() => router.push("/(auth)/sign-up")}
              className="bg-white py-5 rounded-full items-center shadow-2xl"
            >
              <View className="flex-row items-center">
                <Ionicons name="rocket" size={20} color="#3b82f6" />
                <Text className="text-blue-600 font-bold text-lg ml-2">
                  Get Started
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.push("/(auth)/sign-in")}
              className="border-2 border-white/80 py-5 rounded-full items-center backdrop-blur-lg bg-white/5"
            >
              <View className="flex-row items-center">
                <Ionicons name="log-in" size={20} color="white" />
                <Text className="text-white font-bold text-lg ml-2">
                  I Already Have an Account
                </Text>
              </View>
            </TouchableOpacity>

            <Text className="text-white/60 text-xs text-center mt-2">
              By continuing, you agree to our Terms & Privacy Policy
            </Text>
          </View>
        </View>
      </ImageBackground>
    </SafeAreaView>
  );
}