import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSignUp, useAuth } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";
import BACKEND_URL from "../../api/index.js";

export default function SignUp() {
  const { isLoaded, signUp, setActive } = useSignUp();
  const router = useRouter();

  const [emailAddress, setEmailAddress] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [pendingVerification, setPendingVerification] = useState(false);
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const { getToken } = useAuth();

  const onSignUpPress = async () => {
    if (!isLoaded) return;

    setLoading(true);
    try {
      await signUp.create({
        emailAddress,
        password,
        firstName,
        lastName,
      });

      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      setPendingVerification(true);
    } catch (err) {
      console.error("Sign up error:", err);
      Alert.alert("Error", err.errors?.[0]?.message || "Sign up failed");
    } finally {
      setLoading(false);
    }
  };

  const onPressVerify = async () => {
    if (!isLoaded) return;

    setLoading(true);
    try {
      const completeSignUp = await signUp.attemptEmailAddressVerification({
        code,
      });

      if (completeSignUp.status === "complete") {
        await setActive({ session: completeSignUp.createdSessionId });

        // Obtener token JWT
        const token = await getToken();

        // Sincronizar usuario en backend
        await fetch(`http://192.168.100.22:3000/api/user/sync`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        });

        router.replace("/(auth)/sign-in");
      } else {
        Alert.alert("Error", "Verification incomplete. Please try again.");
      }
    } catch (err) {
      console.error("Verification error:", err);
      Alert.alert("Error", err.errors?.[0]?.message || "Verification failed");
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

        <Text className="text-3xl font-bold">Create Account</Text>
        <Text className="text-gray-500 mt-2">
          {pendingVerification
            ? "Check your email for verification code"
            : "Sign up to get started"}
        </Text>

        {!pendingVerification ? (
          <View className="gap-4 mt-8">
            <View>
              <Text className="text-sm text-gray-700 mb-2">First Name</Text>
              <TextInput
                value={firstName}
                placeholder="Enter your first name"
                onChangeText={setFirstName}
                className="border border-gray-300 rounded-lg px-4 py-3"
              />
            </View>

            <View>
              <Text className="text-sm text-gray-700 mb-2">Last Name</Text>
              <TextInput
                value={lastName}
                placeholder="Enter your last name"
                onChangeText={setLastName}
                className="border border-gray-300 rounded-lg px-4 py-3"
              />
            </View>

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
                placeholder="Create a password (min 8 characters)"
                secureTextEntry
                onChangeText={setPassword}
                className="border border-gray-300 rounded-lg px-4 py-3"
              />
            </View>

            <TouchableOpacity
              onPress={onSignUpPress}
              disabled={loading}
              className={`bg-black py-4 rounded-lg items-center mt-4 ${
                loading ? "opacity-50" : ""
              }`}
            >
              <Text className="text-white font-semibold text-base">
                {loading ? "Creating account..." : "Sign Up"}
              </Text>
            </TouchableOpacity>

            <View className="flex-row items-center justify-center mt-4">
              <Text className="text-gray-600">Already have an account? </Text>
              <TouchableOpacity
                onPress={() => router.replace("/(auth)/sign-in")}
              >
                <Text className="text-black font-semibold">Sign In</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View className="gap-4 mt-8">
            <View>
              <Text className="text-sm text-gray-700 mb-2">
                Verification Code
              </Text>
              <Text className="text-xs text-gray-500 mb-2">
                We sent a 6-digit code to {emailAddress}
              </Text>
              <TextInput
                value={code}
                placeholder="Enter verification code"
                onChangeText={setCode}
                className="border border-gray-300 rounded-lg px-4 py-3"
                keyboardType="number-pad"
                maxLength={6}
              />
            </View>

            <TouchableOpacity
              onPress={onPressVerify}
              disabled={loading || code.length < 6}
              className={`bg-black py-4 rounded-lg items-center mt-4 ${
                loading || code.length < 6 ? "opacity-50" : ""
              }`}
            >
              <Text className="text-white font-semibold text-base">
                {loading ? "Verifying..." : "Verify Email"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setPendingVerification(false)}
              className="mt-2"
            >
              <Text className="text-center text-gray-600">
                Wrong email? Go back
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}
