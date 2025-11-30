import { useEffect } from "react";
import { useAuth, useUser } from "@clerk/clerk-expo";
import api from "../api/index.js";
import * as SecureStore from "expo-secure-store";
import { sendLocalNotification } from "./usePushNotifications";

export default function useUnpaidBookingsNotification() {
  const { isSignedIn } = useUser();
  const { getToken } = useAuth();

  useEffect(() => {
    if (!isSignedIn) return;

    const timer = setTimeout(() => {
      checkUnpaidBookingsAndNotify();
    }, 2000);

    return () => clearTimeout(timer);
  }, [isSignedIn]);

  const checkUnpaidBookingsAndNotify = async () => {
    try {
      const token = await getToken();

      if (!token) {
        return;
      }

      await SecureStore.setItemAsync("clerkToken", token);

      const { data } = await api.get("/api/bookings/user", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (data.success && data.bookings) {
        const unpaid = data.bookings.filter(booking => !booking.isPaid);
        
        // Filtrar reservas próximas (dentro de 30 días)
        const now = new Date();
        const upcomingUnpaid = unpaid.filter(booking => {
          const checkInDate = new Date(booking.checkInDate);
          const daysUntilCheckIn = Math.ceil((checkInDate - now) / (1000 * 60 * 60 * 24));
          return daysUntilCheckIn <= 30 && daysUntilCheckIn >= 0;
        });

        if (upcomingUnpaid.length > 0) {
          const closestBooking = upcomingUnpaid.reduce((closest, booking) => {
            const daysUntil = Math.ceil((new Date(booking.checkInDate) - now) / (1000 * 60 * 60 * 24));
            const closestDays = Math.ceil((new Date(closest.checkInDate) - now) / (1000 * 60 * 60 * 24));
            return daysUntil < closestDays ? booking : closest;
          }, upcomingUnpaid[0]);

          const daysUntil = Math.ceil((new Date(closestBooking.checkInDate) - now) / (1000 * 60 * 60 * 24));

          let notificationBody = "";
          
          if (daysUntil === 0) {
            notificationBody = `Your check-in is TODAY! You have ${upcomingUnpaid.length} unpaid booking${upcomingUnpaid.length > 1 ? 's' : ''}. Please review your reservations.`;
          } else if (daysUntil === 1) {
            notificationBody = `Your check-in is TOMORROW! You have ${upcomingUnpaid.length} unpaid booking${upcomingUnpaid.length > 1 ? 's' : ''}. Please review your reservations.`;
          } else if (daysUntil <= 7) {
            notificationBody = `You have ${upcomingUnpaid.length} unpaid booking${upcomingUnpaid.length > 1 ? 's' : ''} in the next ${daysUntil} days. Please review your reservations.`;
          } else {
            notificationBody = `You have ${upcomingUnpaid.length} unpaid booking${upcomingUnpaid.length > 1 ? 's' : ''}. Please review your reservations.`;
          }

          await sendLocalNotification(
            "⚠️ Payment Pending",
            notificationBody,
            {
              type: "unpaid_bookings",
              count: upcomingUnpaid.length,
              closestCheckIn: closestBooking.checkInDate,
            }
          );
        }
      }
    } catch (error) {
      console.error("Error checking unpaid bookings:", error);

      if (error.response?.status === 401) {
        try {
          const newToken = await getToken({ skipCache: true });

          if (newToken) {
            await SecureStore.setItemAsync("clerkToken", newToken);
            await checkUnpaidBookingsAndNotify();
          }
        } catch (refreshError) {
          console.error("Failed to refresh token:", refreshError);
        }
      }
    }
  };
}