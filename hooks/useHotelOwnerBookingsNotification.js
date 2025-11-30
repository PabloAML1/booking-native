import { useEffect } from "react";
import { useAuth, useUser } from "@clerk/clerk-expo";
import api from "../api/index.js";
import * as SecureStore from "expo-secure-store";
import { sendLocalNotification } from "./usePushNotifications.js";

export default function useHotelOwnerBookingsNotification() {
  const { isSignedIn } = useUser();
  const { getToken } = useAuth();

  useEffect(() => {
    if (!isSignedIn) return;

    // Esperar 2 segundos después de que cargue la app
    const timer = setTimeout(() => {
      checkNewBookingsAndNotify();
    }, 2000);

    return () => clearTimeout(timer);
  }, [isSignedIn]);

  const checkNewBookingsAndNotify = async () => {
    try {
      const token = await getToken();

      if (!token) {
        return;
      }

      await SecureStore.setItemAsync("clerkToken", token);

      // Obtener información del usuario para verificar si es hotel owner
      const userResponse = await api.get("/api/user", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // Solo continuar si el usuario es hotel owner
      if (userResponse.data.success && userResponse.data.role !== "hotelOwner") {
        return;
      }

      // Obtener reservas del hotel
      const { data } = await api.get("/api/bookings/hotel", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (data.success && data.dashboardData) {
        const { bookings, totalBookings, totalRevenue } = data.dashboardData;

        // Filtrar reservas recientes (últimas 24 horas)
        const now = new Date();
        const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        
        const recentBookings = bookings.filter(booking => {
          const bookingDate = new Date(booking.createdAt);
          return bookingDate >= oneDayAgo;
        });

        // Filtrar reservas pendientes de pago
        const unpaidBookings = bookings.filter(booking => !booking.isPaid);

        // Filtrar próximos check-ins (próximos 7 días)
        const upcomingCheckIns = bookings.filter(booking => {
          const checkInDate = new Date(booking.checkInDate);
          const daysUntilCheckIn = Math.ceil((checkInDate - now) / (1000 * 60 * 60 * 24));
          return daysUntilCheckIn <= 7 && daysUntilCheckIn >= 0;
        });

        // 🔔 NOTIFICACIÓN: Nuevas reservas en las últimas 24 horas
        if (recentBookings.length > 0) {
          const latestBooking = recentBookings[0];
          
          let notificationBody = "";
          
          if (recentBookings.length === 1) {
            notificationBody = `${latestBooking.user.username} booked ${latestBooking.room.roomType} at ${latestBooking.hotel.name}. Total: $${latestBooking.totalPrice}`;
          } else {
            notificationBody = `You have ${recentBookings.length} new bookings! Total revenue: $${recentBookings.reduce((sum, b) => sum + b.totalPrice, 0)}`;
          }

          await sendLocalNotification(
            "🎉 New Booking!",
            notificationBody,
            {
              type: "new_booking",
              count: recentBookings.length,
              bookingId: latestBooking._id,
            }
          );

        }

        if (unpaidBookings.length > 0) {
          await sendLocalNotification(
            "💰 Pending Payments",
            `You have ${unpaidBookings.length} unpaid booking${unpaidBookings.length > 1 ? 's' : ''}. Total pending: $${unpaidBookings.reduce((sum, b) => sum + b.totalPrice, 0)}`,
            {
              type: "unpaid_summary",
              count: unpaidBookings.length,
            }
          );

          console.log(`💰 ${unpaidBookings.length} reservas sin pagar`);
        }

        if (upcomingCheckIns.length > 0) {
          const todayCheckIns = upcomingCheckIns.filter(booking => {
            const daysUntil = Math.ceil((new Date(booking.checkInDate) - now) / (1000 * 60 * 60 * 24));
            return daysUntil === 0;
          });

          const tomorrowCheckIns = upcomingCheckIns.filter(booking => {
            const daysUntil = Math.ceil((new Date(booking.checkInDate) - now) / (1000 * 60 * 60 * 24));
            return daysUntil === 1;
          });

          if (todayCheckIns.length > 0) {
            await sendLocalNotification(
              "🏨 Check-ins Today!",
              `You have ${todayCheckIns.length} guest${todayCheckIns.length > 1 ? 's' : ''} checking in today. Make sure rooms are ready!`,
              {
                type: "today_checkins",
                count: todayCheckIns.length,
              }
            );
          }

          if (tomorrowCheckIns.length > 0) {
            await sendLocalNotification(
              "📅 Check-ins Tomorrow",
              `You have ${tomorrowCheckIns.length} guest${tomorrowCheckIns.length > 1 ? 's' : ''} checking in tomorrow. Time to prepare!`,
              {
                type: "tomorrow_checkins",
                count: tomorrowCheckIns.length,
              }
            );
          }
        }
      }
    } catch (error) {
      console.error("Error checking hotel bookings:", error);

      if (error.response?.status === 401) {
        try {
          const newToken = await getToken({ skipCache: true });

          if (newToken) {
            await SecureStore.setItemAsync("clerkToken", newToken);
            await checkNewBookingsAndNotify();
          }
        } catch (refreshError) {
          console.error("Failed to refresh token:", refreshError);
        }
      }
    }
  };
}