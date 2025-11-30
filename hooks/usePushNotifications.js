import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export async function requestNotificationPermissions() {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") {
    return false;
  }
  return true;
}

export async function sendLocalNotification(title, body, data = {}) {
  try {
    // Solicitar permisos antes de enviar
    const hasPermission = await requestNotificationPermissions();
    if (!hasPermission) return;

    await Notifications.scheduleNotificationAsync({
      content: {
        title: title,
        body: body,
        data: data,
        sound: true,
        priority: Platform.OS === 'android' 
          ? Notifications.AndroidNotificationPriority.HIGH 
          : undefined,
      },
      trigger: null,
    });
  } catch (error) {
    console.error("Error enviando notificación:", error);
  }
}

// 🔥 Función para programar notificación futura
export async function scheduleNotification(title, body, triggerDate, data = {}) {
  try {
    const hasPermission = await requestNotificationPermissions();
    if (!hasPermission) return;

    const trigger = triggerDate instanceof Date 
      ? triggerDate 
      : new Date(triggerDate);

    await Notifications.scheduleNotificationAsync({
      content: {
        title: title,
        body: body,
        data: data,
        sound: true,
        priority: Platform.OS === 'android' 
          ? Notifications.AndroidNotificationPriority.HIGH 
          : undefined,
      },
      trigger: trigger,
    });
  } catch (error) {
    console.error("❌ Error programando notificación:", error);
  }
}
