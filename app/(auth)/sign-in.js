import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSignIn, useAuth } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import BACKEND_URL from "../../api/index.js";

export default function SignIn() {
  const { signIn, setActive, isLoaded } = useSignIn();
  const { signOut, getToken } = useAuth();
  const router = useRouter();

  const [emailAddress, setEmailAddress] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const onSignInPress = async () => {
    if (!isLoaded) return;

    if (!emailAddress || !password) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    setLoading(true);

    try {
      // Cerrar cualquier sesión existente
      await signOut();

      // Crear sesión en Clerk
      const completeSignIn = await signIn.create({
        identifier: emailAddress,
        password,
      });

      if (completeSignIn.status !== "complete") {
        Alert.alert("Error", "Sign in incomplete. Please try again.");
        setLoading(false);
        return;
      }

      // Activar sesión
      await setActive({ session: completeSignIn.createdSessionId });

      // Obtener token JWT de Clerk
      const token = await getToken();

      if (!token) {
        Alert.alert("Error", "No token returned from Clerk");
        setLoading(false);
        return;
      }

      // Validar usuario en tu backend
      try {
        const response = await fetch(`http://192.168.100.22:3000/api/user`, {
          method: "GET",
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();

        if (!data.success) {
          Alert.alert("Error", data.message || "User inactive");
          await signOut();
          setLoading(false);
          return;
        }

        // Guardar token localmente
        await SecureStore.setItemAsync("clerkToken", token);

        // Redirigir a tabs
        router.replace("/(tabs)");
      } catch (err) {
        console.error("Error validating user:", err);
        Alert.alert("Error", "Failed to validate user");
        await signOut();
      }
    } catch (err) {
      console.error("Sign in error:", err);
      Alert.alert("Error", err.errors?.[0]?.message || "Sign in failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 px-6 py-6">
        <TouchableOpacity onPress={() => router.back()} className="mb-8">
          <Text className="text-2xl">←</Text>
        </TouchableOpacity>

        <Text className="text-3xl font-bold">Welcome Back</Text>
        <Text className="text-gray-500 mt-2">Sign in to continue</Text>

        <View className="gap-4 mt-8">
          <View>
            <Text className="text-sm text-gray-700 mb-2">Email</Text>
            <TextInput
              autoCapitalize="none"
              value={emailAddress}
              placeholder="Enter your email"
              onChangeText={setEmailAddress}
              className="border border-gray-300 rounded-lg px-4 py-3"
              keyboardType="email-address"
            />
          </View>

          <View>
            <Text className="text-sm text-gray-700 mb-2">Password</Text>
            <TextInput
              value={password}
              placeholder="Enter your password"
              secureTextEntry
              onChangeText={setPassword}
              className="border border-gray-300 rounded-lg px-4 py-3"
            />
          </View>

          <TouchableOpacity
            onPress={onSignInPress}
            disabled={loading}
            className={`bg-black py-4 rounded-lg items-center mt-4 ${
              loading ? "opacity-50" : ""
            }`}
          >
            <Text className="text-white font-semibold text-base">
              {loading ? "Signing in..." : "Sign In"}
            </Text>
          </TouchableOpacity>

          <View className="flex-row items-center justify-center mt-4">
            <Text className="text-gray-600">Don't have an account? </Text>
            <TouchableOpacity onPress={() => router.replace("/(auth)/sign-up")}>
              <Text className="text-black font-semibold">Sign Up</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}
