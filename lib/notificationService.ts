import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { useNotificationStore } from "./notificationStore";

// Configure how notifications should be handled when the app is running
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function requestNotificationPermissions(): Promise<boolean> {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("electricity-prices", {
      name: "Electricity Price Alerts",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#FF231F7C",
    });
  }

  return finalStatus === "granted";
}

export function checkPriceThresholds(currentPrice: number): void {
  const { notifications, isNotificationsEnabled } = useNotificationStore.getState();

  if (!isNotificationsEnabled) {
    return;
  }

  notifications.forEach((notification) => {
    if (!notification.enabled) {
      return;
    }

    let shouldNotify = false;
    let notificationTitle = "";
    let notificationBody = "";

    if (notification.type === "above" && currentPrice > notification.price) {
      shouldNotify = true;
      notificationTitle = "High Electricity Price Alert";
      notificationBody = `Price is above €${notification.price}/MWh (Current: €${currentPrice.toFixed(2)}/MWh)`;
    } else if (notification.type === "below" && currentPrice < notification.price) {
      shouldNotify = true;
      notificationTitle = "Low Electricity Price Alert";
      notificationBody = `Price is below €${notification.price}/MWh (Current: €${currentPrice.toFixed(2)}/MWh)`;
    }

    if (shouldNotify) {
      scheduleNotification(notificationTitle, notificationBody);
    }
  });
}

export async function scheduleNotification(title: string, body: string): Promise<void> {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        sound: "default",
      },
      trigger: null, // Show immediately
    });
  } catch (error) {
    console.error("Failed to schedule notification:", error);
  }
}

export function getCurrentPrice(priceHistory: Array<{ value: number; date: Date }>): number | null {
  if (priceHistory.length === 0) {
    return null;
  }

  // Find the current or most recent price
  const now = new Date();
  let currentPrice = null;

  for (const price of priceHistory) {
    if (price.date <= now) {
      currentPrice = price.value;
    } else {
      break;
    }
  }

  return currentPrice;
}
