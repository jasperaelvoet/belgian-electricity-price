import * as BackgroundFetch from "expo-background-fetch";
import * as TaskManager from "expo-task-manager";
import { checkPriceThresholds, getCurrentPrice } from "./notificationService";
import { useNotificationStore } from "./notificationStore";

const BACKGROUND_FETCH_TASK = "background-price-check";

// Define the background task
TaskManager.defineTask(BACKGROUND_FETCH_TASK, async () => {
  console.log("Background task: Checking electricity prices...");

  try {
    const { isNotificationsEnabled } = useNotificationStore.getState();

    if (!isNotificationsEnabled) {
      console.log("Notifications disabled, skipping background check");
      return BackgroundFetch.BackgroundFetchResult.NoData;
    }

    // Fetch current electricity prices
    const currentDate = new Date();
    const formatDate = (date: Date) => {
      const year = date.getFullYear();
      const month = (date.getMonth() + 1).toString().padStart(2, "0");
      const day = date.getDate().toString().padStart(2, "0");
      return `${year}-${month}-${day}`;
    };

    const currentUrl = `https://griddata.elia.be/eliabecontrols.prod/interface/Interconnections/daily/auctionresultsqh/${formatDate(currentDate)}`;

    const response = await fetch(currentUrl);

    if (!response.ok) {
      console.log("Failed to fetch price data in background");
      return BackgroundFetch.BackgroundFetchResult.Failed;
    }

    const data = await response.json();

    if (!data || data.length === 0) {
      console.log("No price data available");
      return BackgroundFetch.BackgroundFetchResult.NoData;
    }

    // Format the data and get current price
    const formattedData = data.map((item: any) => ({
      value: item.price,
      date: new Date(item.dateTime),
    }));

    const currentPrice = getCurrentPrice(formattedData);

    if (currentPrice !== null) {
      console.log(`Background check: Current price is €${currentPrice}/MWh`);
      checkPriceThresholds(currentPrice);
    }

    return BackgroundFetch.BackgroundFetchResult.NewData;
  } catch (error) {
    console.error("Background task error:", error);
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

export async function registerBackgroundTask(): Promise<boolean> {
  try {
    // Check if the task is already registered
    const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_FETCH_TASK);

    if (isRegistered) {
      console.log("Background task already registered");
      return true;
    }

    // Register the background fetch task
    await BackgroundFetch.registerTaskAsync(BACKGROUND_FETCH_TASK, {
      minimumInterval: 15 * 60, // 15 minutes (minimum allowed by iOS)
      stopOnTerminate: false, // Continue running when app is terminated
      startOnBoot: true, // Start when device boots
    });

    console.log("Background task registered successfully");
    return true;
  } catch (error) {
    console.error("Failed to register background task:", error);
    return false;
  }
}

export async function unregisterBackgroundTask(): Promise<void> {
  try {
    const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_FETCH_TASK);

    if (isRegistered) {
      await BackgroundFetch.unregisterTaskAsync(BACKGROUND_FETCH_TASK);
      console.log("Background task unregistered");
    }
  } catch (error) {
    console.error("Failed to unregister background task:", error);
  }
}

export async function getBackgroundFetchStatus(): Promise<string> {
  try {
    const status = await BackgroundFetch.getStatusAsync();

    switch (status) {
      case BackgroundFetch.BackgroundFetchStatus.Available:
        return "Available";
      case BackgroundFetch.BackgroundFetchStatus.Denied:
        return "Denied";
      case BackgroundFetch.BackgroundFetchStatus.Restricted:
        return "Restricted";
      default:
        return "Unknown";
    }
  } catch (error) {
    console.error("Failed to get background fetch status:", error);
    return "Error";
  }
}
