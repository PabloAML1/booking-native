import { Slot } from "expo-router";
import { ClerkProvider, ClerkLoaded } from "@clerk/clerk-expo";
import { AppProvider } from "../context/AppContext";
import * as SecureStore from "expo-secure-store";
import useUnpaidBookingsNotification from "../hooks/useUnpaidBookingsNotification";
import useHotelOwnerBookingsNotification from "../hooks/useHotelOwnerBookingsNotification";
import "../global.css";
import "../suppressWarnings";

const tokenCache = {
  async getToken(key) {
    try {
      return await SecureStore.getItemAsync(key);
    } catch (err) {
      return null;
    }
  },
  async saveToken(key, value) {
    try {
      return await SecureStore.setItemAsync(key, value);
    } catch (err) {
      return;
    }
  },
};

const CLERK_PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;

if (!CLERK_PUBLISHABLE_KEY) {
  throw new Error("Missing EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY");
}

function RootLayoutContent() {
  useUnpaidBookingsNotification();
  useHotelOwnerBookingsNotification();
  return <Slot />;
}

export default function RootLayout() {
  return (
    <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY} tokenCache={tokenCache}>
      <ClerkLoaded>
        <AppProvider>
          <RootLayoutContent />
        </AppProvider>
      </ClerkLoaded>
    </ClerkProvider>
  );
}