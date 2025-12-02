import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSignUp, useAuth } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";
import { BACKEND_URL } from "../../api/index.js";
import { useOAuth } from "@clerk/clerk-expo";
import * as SecureStore from 'expo-secure-store';

export default function SignUp() {
  const { isLoaded, signUp, setActive } = useSignUp();
  const router = useRouter();
  const { getToken } = useAuth();
  const { startOAuthFlow } = useOAuth({ strategy: "oauth_google" });

  const [emailAddress, setEmailAddress] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [pendingVerification, setPendingVerification] = useState(false);
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);

  const getErrorMessage = (error) => {
    if (error.errors && error.errors.length > 0) {
      const errorCode = error.errors[0].code;
      const errorMessage = error.errors[0].message;

      if (errorMessage.includes("email address is invalid")) {
        return "Please enter a valid email address.";
      }
      if (errorMessage.includes("That email address is taken")) {
        return "This email is already registered. Please sign in instead.";
      }
      if (errorMessage.includes("password is too common")) {
        return "This password is too common. Please choose a stronger password.";
      }
      if (errorMessage.includes("Password is too short")) {
        return "Password must be at least 8 characters long.";
      }
      if (errorCode === "form_param_format_invalid") {
        return "Please check your information and try again.";
      }
      if (errorCode === "form_identifier_exists") {
        return "This email is already registered. Please sign in.";
      }

      if (errorMessage && !errorMessage.includes("clerk") && !errorMessage.includes("Error")) {
        return errorMessage;
      }
    }

    return "Sign up failed. Please try again.";
  };

  const onSignUpPress = async () => {
    if (!isLoaded) return;

    if (!firstName.trim() || !lastName.trim()) {
      Alert.alert("Missing Information", "Please enter your full name");
      return;
    }

    if (!emailAddress.includes("@")) {
      Alert.alert("Invalid Email", "Please enter a valid email address");
      return;
    }

    if (password.length < 8) {
      Alert.alert("Weak Password", "Password must be at least 8 characters long");
      return;
    }

    setLoading(true);
    try {
      await signUp.create({
        emailAddress,
        password,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
      });

      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      setPendingVerification(true);
      Alert.alert(
        "Verification Email Sent", 
        `We sent a 6-digit code to ${emailAddress}. Please check your inbox.`
      );
    } catch (err) {
      const friendlyMessage = getErrorMessage(err);
      Alert.alert("Sign Up Error", friendlyMessage);
    } finally {
      setLoading(false);
    }
  };

  const onPressVerify = async () => {
    if (!isLoaded) return;

    if (code.length < 6) {
      Alert.alert("Invalid Code", "Please enter the 6-digit verification code");
      return;
    }

    setLoading(true);
    try {
      const completeSignUp = await signUp.attemptEmailAddressVerification({
        code,
      });

      if (completeSignUp.status === "complete") {
        await setActive({ session: completeSignUp.createdSessionId });

        const token = await getToken();

        try {
          await fetch(`${BACKEND_URL}/api/user/sync`, {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` },
          });
        } catch (syncError) {
          console.error("Sync error:", syncError);
        }

        Alert.alert(
          "Success!", 
          "Your account has been created successfully. Please sign in.",
          [{ text: "OK", onPress: () => router.replace("/(auth)/sign-in") }]
        );
      } else {
        Alert.alert("Verification Incomplete", "Please check the code and try again.");
      }
    } catch (err) {
      
      if (err.errors && err.errors[0]?.message.includes("incorrect")) {
        Alert.alert("Incorrect Code", "The verification code is incorrect. Please try again.");
      } else if (err.errors && err.errors[0]?.message.includes("expired")) {
        Alert.alert(
          "Code Expired", 
          "The verification code has expired. Please go back and request a new one."
        );
      } else {
        Alert.alert("Verification Failed", "Could not verify your email. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const onGoogleSignUp = async () => {
    if (!isLoaded) return;

    setLoading(true);
    let isNewUser = false;

    try {
      const result = await startOAuthFlow();
      const { createdSessionId, setActive: oAuthSetActive } = result;

      // ⭐ DETECTAR SI ES USUARIO NUEVO
      isNewUser = result.createdUserId !== undefined && result.createdUserId !== null;

      if (createdSessionId) {
        await oAuthSetActive({ session: createdSessionId });

        const token = await getToken();

        if (!token) {
          Alert.alert("Authentication Error", "Could not authenticate. Please try again.");
          setLoading(false);
          return;
        }

        await SecureStore.setItemAsync("clerkToken", token);

        try {
          await fetch(`${BACKEND_URL}/api/user/sync`, {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` },
          });

          // ⭐ MENSAJE CONDICIONAL
          if (isNewUser) {
            Alert.alert(
              "Success!",
              "Your account has been created successfully.",
              [{ 
                text: "OK", 
                onPress: () => {
                  setTimeout(() => {
                    router.replace("/(tabs)/rooms");
                  }, 50);
                }
              }]
            );
          } else {
            Alert.alert(
              "Welcome Back!",
              "You're already registered. Welcome back!",
              [{ 
                text: "OK", 
                onPress: () => {
                  setTimeout(() => {
                    router.replace("/(tabs)/rooms");
                  }, 50);
                }
              }]
            );
          }
        } catch (syncError) {
          console.error("Sync error:", syncError);
          setTimeout(() => {
            router.replace("/(tabs)/rooms");
          }, 50);
        }
      }
    } catch (err) {
      console.error("Google OAuth error:", err);
      Alert.alert("Sign Up Error", "Could not sign up with Google. Please try again.");
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
            {/* Google Sign Up Button */}
            <TouchableOpacity
              onPress={onGoogleSignUp}
              disabled={loading}
              className={`border border-gray-300 py-4 rounded-lg items-center flex-row justify-center ${
                loading ? "opacity-50" : ""
              }`}
            >
              <Text className="text-gray-700 font-semibold text-base mr-2">
                Continue with Google
              </Text>
            </TouchableOpacity>

            {/* Divider */}
            <View className="flex-row items-center my-4">
              <View className="flex-1 h-px bg-gray-300" />
              <Text className="mx-4 text-gray-500">OR</Text>
              <View className="flex-1 h-px bg-gray-300" />
            </View>

            <View>
              <Text className="text-sm text-gray-700 mb-2">First Name</Text>
              <TextInput
                value={firstName}
                placeholder="Enter your first name"
                onChangeText={setFirstName}
                className="border border-gray-300 rounded-lg px-4 py-3"
                autoComplete="name-given"
              />
            </View>

            <View>
              <Text className="text-sm text-gray-700 mb-2">Last Name</Text>
              <TextInput
                value={lastName}
                placeholder="Enter your last name"
                onChangeText={setLastName}
                className="border border-gray-300 rounded-lg px-4 py-3"
                autoComplete="name-family"
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
                autoComplete="email"
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
                autoComplete="password-new"
              />
              <Text className="text-xs text-gray-500 mt-1">
                Must be at least 8 characters long
              </Text>
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
                We sent a 6-digit code to {emailAddress}. Check your inbox and spam folder.
              </Text>
              <TextInput
                value={code}
                placeholder="Enter verification code"
                onChangeText={setCode}
                className="border border-gray-300 rounded-lg px-4 py-3 text-center text-lg tracking-widest"
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
              onPress={() => {
                setPendingVerification(false);
                setCode("");
              }}
              className="mt-2"
            >
              <Text className="text-center text-gray-600">
                Wrong email? Go back and try again
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}
