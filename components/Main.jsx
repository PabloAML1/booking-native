import { StatusBar } from "expo-status-bar";
import { Text, Image, View, TouchableOpacity } from "react-native";
import { Link } from "expo-router";
import icon from "../assets/favicon.png";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";

export function Main() {
  const insets = useSafeAreaInsets();

  return (
     <LinearGradient
      colors={['#000000', '#4c1d95']} 
      style={{ flex: 1, paddingTop: insets.top, paddingBottom: insets.bottom }}
    >
      <Link href="/rooms" className="text-white text-2xl">Ir a las rooms</Link>
      <View className="flex-1 items-center justify-center px-6 bg-black">
        

        <View className="bg-purple-800/80 rounded-3xl p-6 w-full max-w-md items-center shadow-lg">
          <Image source={icon} className="w-28 h-28 mb-4" resizeMode="contain" />

          <Text className="text-4xl font-extrabold text-white mb-2 text-center">
            yyyyyy
          </Text>

          <Text className="text-lg text-fuchsia-300 mb-6 text-center">
            Geek food made simple 🍔
          </Text>

          <View className="flex-row space-x-4">
            <TouchableOpacity className="bg-fuchsia-500 py-3 px-6 rounded-full">
              <Text className="text-white font-semibold text-lg">Get Started</Text>
            </TouchableOpacity>

            <TouchableOpacity className="bg-transparent border border-white/40 py-3 px-6 rounded-full">
              <Text className="text-white font-medium text-lg">Learn More</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <StatusBar style="light" />
    </LinearGradient>
  );
}
