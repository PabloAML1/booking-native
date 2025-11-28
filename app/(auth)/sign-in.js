import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSignIn, useAuth } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { BACKEND_URL } from "../../api/index.js";

export default function SignIn() {
  const { signIn, setActive, isLoaded } = useSignIn();
  const { signOut, getToken } = useAuth();
  const router = useRouter();

  const [emailAddress, setEmailAddress] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // Función para traducir errores de Clerk a mensajes amigables
  const getErrorMessage = (error) => {
    // Si el error tiene un mensaje de Clerk
    if (error.errors && error.errors.length > 0) {
      const errorCode = error.errors[0].code;
      const errorMessage = error.errors[0].message;

      // Mapeo de errores comunes
      if (errorMessage.includes("Password is incorrect")) {
        return "Incorrect password. Please try again.";
      }
      if (errorMessage.includes("Identifier is incorrect")) {
        return "This email is not registered. Please sign up first.";
      }
      if (errorMessage.includes("Too many requests")) {
        return "Too many login attempts. Please wait a few minutes and try again.";
      }
      if (errorCode === "form_identifier_not_found") {
        return "Account not found. Please check your email or sign up.";
      }
      if (errorCode === "form_password_incorrect") {
        return "Incorrect password. Please try again.";
      }
      if (errorCode === "session_exists") {
        return "You're already signed in.";
      }

      // Retornar el mensaje de Clerk si es claro
      if (errorMessage && !errorMessage.includes("clerk") && !errorMessage.includes("Error")) {
        return errorMessage;
      }
    }

    // Mensajes genéricos según el tipo de error
    if (error.message) {
      if (error.message.includes("network")) {
        return "Network error. Please check your connection.";
      }
      if (error.message.includes("timeout")) {
        return "Request timed out. Please try again.";
      }
    }

    return "Sign in failed. Please try again.";
  };

  const onSignInPress = async () => {
    if (!isLoaded) return;

    if (!emailAddress || !password) {
      Alert.alert("Missing Information", "Please enter your email and password");
      return;
    }

    // Validación básica de email
    if (!emailAddress.includes("@")) {
      Alert.alert("Invalid Email", "Please enter a valid email address");
      return;
    }

    // Validación de contraseña
    if (password.length < 8) {
      Alert.alert("Invalid Password", "Password must be at least 8 characters long");
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
        Alert.alert("Sign In Incomplete", "Please complete the sign in process and try again.");
        setLoading(false);
        return;
      }

      // Activar sesión
      await setActive({ session: completeSignIn.createdSessionId });

      // Obtener token JWT de Clerk
      const token = await getToken();

      if (!token) {
        Alert.alert("Authentication Error", "Could not authenticate. Please try again.");
        setLoading(false);
        return;
      }

      // Validar usuario en tu backend
      try {
        const response = await fetch(`${BACKEND_URL}/api/user`, {
          method: "GET",
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();

        if (!data.success) {
          Alert.alert(
            "Account Inactive", 
            data.message || "Your account is currently inactive. Please contact support."
          );
          await signOut();
          setLoading(false);
          return;
        }

        // Guardar token localmente
        await SecureStore.setItemAsync("clerkToken", token);

        // Redirigir a tabs
        router.replace("/(tabs)/rooms");
      } catch (err) {
        console.error("Error validating user:", err);
        Alert.alert(
          "Validation Error", 
          "Could not verify your account. Please check your connection and try again."
        );
        await signOut();
      }
    } catch (err) {
      console.error("Sign in error:", err);
      const friendlyMessage = getErrorMessage(err);
      Alert.alert("Sign In Error", friendlyMessage);
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
              autoComplete="email"
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
              autoComplete="password"
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
