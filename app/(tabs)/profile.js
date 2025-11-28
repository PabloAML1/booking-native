import React from "react";
import { View, Text, ScrollView, TouchableOpacity, Image, Alert } from "react-native";
import { useUser, useAuth } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

export default function Profile() {
  const { user } = useUser();
  const { signOut } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          try {
            await signOut();
            router.replace("/(auth)/welcome");
          } catch (error) {
            console.error("Error signing out:", error);
            Alert.alert("Error", "Failed to sign out");
          }
        },
      },
    ]);
  };

  const handleNotifications = () => {
    router.push("/notifications");
  };

  return (
    <View className="flex-1 bg-white">
      <ScrollView className="flex-1 px-6 py-10">
        <Text className="text-3xl font-bold mb-2">My Profile</Text>

        <View className="items-center mb-8">
          <View className="w-24 h-24 rounded-full bg-gray-200 items-center justify-center overflow-hidden mb-4">
            {user?.imageUrl ? (
              <Image source={{ uri: user.imageUrl }} className="w-full h-full" />
            ) : (
              <Text className="text-4xl text-gray-600 font-semibold">
                {user?.firstName?.[0] || "U"}
              </Text>
            )}
          </View>
          <Text className="text-2xl font-bold">
            {user?.firstName} {user?.lastName}
          </Text>
          <Text className="text-gray-500 mt-1">
            {user?.primaryEmailAddress?.emailAddress}
          </Text>
        </View>

        <View className="bg-gray-50 rounded-lg p-4 mb-4">
          <TouchableOpacity 
            onPress={handleNotifications}
            className="py-4 border-b border-gray-200 flex-row items-center justify-between"
          >
            <View className="flex-row items-center">
              <Ionicons name="notifications-outline" size={22} color="#333" />
              <Text className="text-base ml-3">Notifications</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>

          <TouchableOpacity className="py-4 border-b border-gray-200 flex-row items-center justify-between">
            <View className="flex-row items-center">
              <Ionicons name="settings-outline" size={22} color="#333" />
              <Text className="text-base ml-3">Settings</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>

          <TouchableOpacity className="py-4 flex-row items-center justify-between">
            <View className="flex-row items-center">
              <Ionicons name="help-circle-outline" size={22} color="#333" />
              <Text className="text-base ml-3">Help & Support</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          onPress={handleSignOut}
          className="bg-red-500 py-4 rounded-lg items-center mt-4 mb-8"
        >
          <Text className="text-white font-semibold">Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}