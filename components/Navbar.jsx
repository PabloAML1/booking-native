import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  Modal,
  ScrollView,
  Pressable,
  Alert,
} from "react-native";
import { useRouter, usePathname } from "expo-router";
import { useUser, useClerk } from "@clerk/clerk-expo";
import { SafeAreaView } from "react-native-safe-area-context";

const Navbar = () => {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isLoaded } = useUser();
  const clerk = useClerk();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navLinks = [
    { name: "Home", path: "/" },
    { name: "Rooms", path: "/rooms" },
  ];

  const isScrolled = pathname !== "/";

  const handleNavigation = (path) => {
    router.push(path);
    setIsMenuOpen(false);
  };

  const handleSignIn = () => {
    router.push("/sign-in"); // 👈 Cambia esto
  };

  const handleSignOut = async () => {
    try {
      await clerk.signOut();
      setIsMenuOpen(false);
      router.push("/");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  if (!isLoaded) {
    return null;
  }

  return (
    <>
      <SafeAreaView
        className={`${
          isScrolled ? "bg-white shadow-md" : "bg-transparent"
        } px-6 py-4`}
      >
        <View className="flex-row items-center justify-between">
          {/* Logo */}
          <TouchableOpacity onPress={() => handleNavigation("/")}>
            <View className="flex-row items-center gap-2">
              <Text
                className={`text-2xl font-bold ${
                  isScrolled ? "text-gray-800" : "text-white"
                }`}
              >
                🏨 Booking
              </Text>
            </View>
          </TouchableOpacity>

          {/* Right Side */}
          <View className="flex-row items-center gap-3">
            {user ? (
              <>
                {/* User Avatar */}
                <TouchableOpacity
                  onPress={() => handleNavigation("/profile")}
                  className="w-10 h-10 rounded-full bg-gray-200 items-center justify-center overflow-hidden"
                >
                  {user.imageUrl ? (
                    <Image
                      source={{ uri: user.imageUrl }}
                      className="w-full h-full"
                    />
                  ) : (
                    <Text className="text-gray-600 font-semibold">
                      {user.firstName?.[0] || "U"}
                    </Text>
                  )}
                </TouchableOpacity>
              </>
            ) : (
              <TouchableOpacity
                onPress={handleSignIn}
                className={`px-6 py-2 rounded-full ${
                  isScrolled ? "bg-black" : "bg-white"
                }`}
              >
                <Text
                  className={`font-medium ${
                    isScrolled ? "text-white" : "text-black"
                  }`}
                >
                  Sign In
                </Text>
              </TouchableOpacity>
            )}

            {/* Menu Button */}
            <TouchableOpacity onPress={() => setIsMenuOpen(true)}>
              <Text
                className={`text-2xl ${
                  isScrolled ? "text-gray-800" : "text-white"
                }`}
              >
                ☰
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>

      {/* Mobile Menu Modal */}
      <Modal
        visible={isMenuOpen}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsMenuOpen(false)}
      >
        <Pressable
          className="flex-1 bg-black/50"
          onPress={() => setIsMenuOpen(false)}
        >
          <View className="flex-1 bg-white mt-20 rounded-t-3xl">
            <View className="flex-row items-center justify-between px-6 py-4 border-b border-gray-200">
              <Text className="text-xl font-bold">Menu</Text>
              <TouchableOpacity onPress={() => setIsMenuOpen(false)}>
                <Text className="text-2xl text-gray-600">✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView className="flex-1 px-6 py-6">
              {/* User Info */}
              {user && (
                <View className="mb-6 pb-6 border-b border-gray-200">
                  <View className="flex-row items-center gap-3">
                    <View className="w-16 h-16 rounded-full bg-gray-200 items-center justify-center overflow-hidden">
                      {user.imageUrl ? (
                        <Image
                          source={{ uri: user.imageUrl }}
                          className="w-full h-full"
                        />
                      ) : (
                        <Text className="text-2xl text-gray-600 font-semibold">
                          {user.firstName?.[0] || "U"}
                        </Text>
                      )}
                    </View>
                    <View>
                      <Text className="text-lg font-semibold">
                        {user.firstName} {user.lastName}
                      </Text>
                      <Text className="text-sm text-gray-500">
                        {user.primaryEmailAddress?.emailAddress}
                      </Text>
                    </View>
                  </View>
                </View>
              )}

              {/* Navigation Links */}
              {navLinks.map((link, i) => (
                <TouchableOpacity
                  key={i}
                  onPress={() => handleNavigation(link.path)}
                  className="py-4 border-b border-gray-100"
                >
                  <Text className="text-base text-gray-800">{link.name}</Text>
                </TouchableOpacity>
              ))}

              {/* User Actions */}
              {user && (
                <>
                  <TouchableOpacity
                    onPress={() => handleNavigation("/my-bookings")}
                    className="py-4 border-b border-gray-100"
                  >
                    <Text className="text-base text-gray-800">
                      📖 My Bookings
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => handleNavigation("/profile")}
                    className="py-4 border-b border-gray-100"
                  >
                    <Text className="text-base text-gray-800">
                      👤 Profile Settings
                    </Text>
                  </TouchableOpacity>
                </>
              )}

              {/* Sign Out Button */}
              {user && (
                <TouchableOpacity
                  onPress={handleSignOut}
                  className="mt-6 bg-red-500 py-3 rounded-lg items-center"
                >
                  <Text className="text-white font-semibold">Sign Out</Text>
                </TouchableOpacity>
              )}

              {/* Sign In Button */}
              {!user && (
                <TouchableOpacity
                  onPress={() => {
                    handleSignIn();
                    setIsMenuOpen(false);
                  }}
                  className="mt-6 bg-black py-3 rounded-lg items-center"
                >
                  <Text className="text-white font-semibold">Sign In</Text>
                </TouchableOpacity>
              )}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>
    </>
  );
};

export default Navbar;