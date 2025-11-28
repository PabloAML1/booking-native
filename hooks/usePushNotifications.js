import * as Notifications from "expo-notifications";
import { useEffect, useState } from "react";
import * as Device from 'expo-device';

export default function usePushNotifications() {
  const [expoPushToken, setExpoPushToken] = useState("");

  useEffect(() => {
    registerForPushNotificationsAsync().then(token => setExpoPushToken(token));
  }, []);

  return expoPushToken;
}

async function registerForPushNotificationsAsync() {
  if (!Device.isDevice) return null;

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") {
    alert("Permission required for notifications!");
    return null;
  }

  const token = (await Notifications.getExpoPushTokenAsync()).data;
  return token;
}
