import { Tabs } from "expo-router";
import { Text, Platform, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

// Componente personalizado para los iconos de tabs
const TabIcon = ({ focused, emoji, focusedEmoji }) => {
  return (
    <View className="items-center justify-center">
      <View className={`${focused ? 'bg-blue-100' : 'bg-transparent'} rounded-full p-2`}>
        <Text style={{ fontSize: focused ? 12 : 11 }}>
          {focused ? focusedEmoji : emoji}
        </Text>
      </View>
    </View>
  );
};

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  
  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: "white",
            borderTopWidth: 1,
            borderTopColor: "#e5e7eb",
            height: (Platform.OS === "ios" ? 65 : 60) + insets.bottom,
            paddingTop: Platform.OS === "ios" ? 10 : 8,
            paddingBottom: insets.bottom > 0 ? insets.bottom : 10,
            paddingHorizontal: 1,
            elevation: 8,
            shadowColor: "#3b82f6",
            shadowOffset: { width: 0, height: -4 },
            shadowOpacity: 0.1,
            shadowRadius: 12,
          },
          tabBarActiveTintColor: "#3b82f6",
          tabBarInactiveTintColor: "#9ca3af",
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: "700",
            marginTop: 2,
            textTransform: "uppercase",
            letterSpacing: 0.5,
          },
          tabBarIconStyle: {
            marginTop: 2,
          },
          tabBarItemStyle: {
            paddingVertical: 4,
          },
        }}
      >
        <Tabs.Screen
          name="rooms"
          options={{
            title: "Rooms",
            tabBarIcon: ({ focused }) => (
              <TabIcon 
                focused={focused} 
                emoji="🛋️" 
                focusedEmoji="🛏️"
              />
            ),
          }}
        />
        <Tabs.Screen
          name="my-bookings"
          options={{
            title: "Bookings",
            tabBarIcon: ({ focused }) => (
              <TabIcon 
                focused={focused} 
                emoji="📋" 
                focusedEmoji="📖"
              />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: "Profile",
            tabBarIcon: ({ focused }) => (
              <TabIcon 
                focused={focused} 
                emoji="👥" 
                focusedEmoji="👤"
              />
            ),
          }}
        />
        <Tabs.Screen
          name="index"
          options={{
            href: null,
          }}
        />
      </Tabs>
    </SafeAreaView>
  );
}