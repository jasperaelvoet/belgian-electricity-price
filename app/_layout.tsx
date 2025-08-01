import "@/global.css";
import { registerBackgroundTask } from "@/lib/backgroundTask";
import { useNotificationStore } from "@/lib/notificationStore";
import { Stack, router } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { Settings } from "lucide-react-native";
import { useEffect } from "react";
import { TouchableOpacity } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";

SplashScreen.preventAutoHideAsync();

SplashScreen.setOptions({
  duration: 300,
  fade: true,
});

export default function RootLayout() {
  useEffect(() => {
    // Initialize background task if notifications are enabled
    const initializeBackgroundTask = async () => {
      const { isNotificationsEnabled } = useNotificationStore.getState();
      if (isNotificationsEnabled) {
        await registerBackgroundTask();
      }
    };

    initializeBackgroundTask();
  }, []);

  return (
    <GestureHandlerRootView>
      <Stack>
        <Stack.Screen
          name="index"
          options={{
            headerShown: true,
            title: "Day-Ahead Electricity Prices",
            headerRight: () => (
              <TouchableOpacity onPress={() => router.push("/settings")}>
                <Settings size={24} color="#374151" />
              </TouchableOpacity>
            ),
          }}
        />
        <Stack.Screen name="settings" options={{ headerShown: true, title: "Settings" }} />
      </Stack>
    </GestureHandlerRootView>
  );
}
