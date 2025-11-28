import React from "react";
import { View, Text, Image, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";

export default function Welcome() {
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-white">
      <LinearGradient
        colors={["#06b6d4", "#3b82f6"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className="flex-1"
      >
        <View className="flex-1 px-6 justify-between py-12">
          {/* Logo y Hero */}
          <View className="items-center mt-12">
            <Text className="text-white text-5xl font-bold mb-4">🏨</Text>
            <Text className="text-white text-4xl font-bold text-center">
              Booking Native
            </Text>
            <Text className="text-white/80 text-lg text-center mt-4 px-8">
              Find and book amazing rooms around the world
            </Text>
          </View>

          {/* Ilustración */}
          <View className="items-center">
            <View className="w-64 h-64 bg-white/10 rounded-full items-center justify-center">
              <Text className="text-8xl">🌍</Text>
            </View>
          </View>

          {/* Botones */}
          <View className="gap-4">
            <TouchableOpacity
              onPress={() => router.push("/(auth)/sign-up")}
              className="bg-white py-4 rounded-full items-center"
            >
              <Text className="text-blue-600 font-bold text-lg">
                Get Started
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.push("/(auth)/sign-in")}
              className="border-2 border-white py-4 rounded-full items-center"
            >
              <Text className="text-white font-bold text-lg">
                I Already Have an Account
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
}