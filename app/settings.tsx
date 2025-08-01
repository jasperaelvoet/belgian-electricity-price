import {
  getBackgroundFetchStatus,
  registerBackgroundTask,
  unregisterBackgroundTask,
} from "@/lib/backgroundTask";
import { requestNotificationPermissions, scheduleNotification } from "@/lib/notificationService";
import { useNotificationStore } from "@/lib/notificationStore";
import { Bell, Plus, Trash2 } from "lucide-react-native";
import { useEffect, useState } from "react";
import {
  Alert,
  Linking,
  ScrollView,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function Settings() {
  const {
    notifications,
    isNotificationsEnabled,
    setNotificationsEnabled,
    addNotification,
    removeNotification,
    toggleNotification,
  } = useNotificationStore();

  const [newThresholdType, setNewThresholdType] = useState<"above" | "below">("above");
  const [newThresholdPrice, setNewThresholdPrice] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [backgroundFetchStatus, setBackgroundFetchStatus] = useState<string>("Unknown");

  useEffect(() => {
    // Check background fetch status on component mount
    const checkStatus = async () => {
      const status = await getBackgroundFetchStatus();
      setBackgroundFetchStatus(status);
    };
    checkStatus();
  }, []);

  const handleToggleNotifications = async (value: boolean) => {
    if (value) {
      const granted = await requestNotificationPermissions();
      if (granted) {
        // Register background task when notifications are enabled
        const backgroundRegistered = await registerBackgroundTask();
        if (backgroundRegistered) {
          setNotificationsEnabled(true);
          const status = await getBackgroundFetchStatus();
          setBackgroundFetchStatus(status);
        } else {
          Alert.alert(
            "Background Task Failed",
            "Failed to register background monitoring. Notifications will only work when the app is open."
          );
          setNotificationsEnabled(true); // Still enable notifications for foreground
        }
      } else {
        Alert.alert(
          "Permission Required",
          "Please enable notifications in your device settings to receive price alerts.",
          [
            { text: "Cancel", style: "cancel" },
            {
              text: "Open Settings",
              onPress: () => Linking.openSettings(),
            },
          ]
        );
      }
    } else {
      // Unregister background task when notifications are disabled
      await unregisterBackgroundTask();
      setNotificationsEnabled(false);
      const status = await getBackgroundFetchStatus();
      setBackgroundFetchStatus(status);
    }
  };

  const handleAddThreshold = () => {
    const price = parseFloat(newThresholdPrice);
    if (isNaN(price) || price <= 0) {
      Alert.alert("Invalid Price", "Please enter a valid price greater than 0.");
      return;
    }

    addNotification({
      type: newThresholdType,
      price,
      enabled: true,
    });

    setNewThresholdPrice("");
    setShowAddForm(false);
  };

  const handleRemoveThreshold = (id: string) => {
    Alert.alert("Remove Alert", "Are you sure you want to remove this price alert?", [
      { text: "Cancel", style: "cancel" },
      { text: "Remove", style: "destructive", onPress: () => removeNotification(id) },
    ]);
  };

  const handleTestNotification = async () => {
    await scheduleNotification(
      "Test Notification",
      "This is a test notification to verify that alerts are working properly."
    );
    Alert.alert("Test Sent", "A test notification has been sent!");
  };

  return (
    <ScrollView className="flex-1 bg-white">
      {/* Settings Content */}
      <View className="flex-1 px-4 py-6">
        {/* Notifications Section */}
        <View className="mb-6">
          <Text className="mb-4 text-lg font-semibold text-gray-900">Notifications</Text>

          {/* Master Toggle */}
          <View className="mb-4 rounded-lg bg-gray-50 p-4">
            <View className="flex-row items-center justify-between">
              <View className="flex-1">
                <Text className="text-sm font-medium text-gray-700">Enable Price Alerts</Text>
                <Text className="text-xs text-gray-500">
                  Get notified when electricity prices reach your set thresholds
                </Text>
              </View>
              <Switch
                value={isNotificationsEnabled}
                onValueChange={handleToggleNotifications}
                trackColor={{ false: "#e5e7eb", true: "#3b82f6" }}
                thumbColor={isNotificationsEnabled ? "#ffffff" : "#f3f4f6"}
              />
            </View>
          </View>

          {/* Notification Thresholds */}
          {isNotificationsEnabled && (
            <View className="rounded-lg bg-gray-50 p-4">
              <View className="mb-3 flex-row items-center justify-between">
                <Text className="text-sm font-medium text-gray-700">Price Alerts</Text>
                <TouchableOpacity
                  onPress={() => setShowAddForm(!showAddForm)}
                  className="flex-row items-center rounded-md bg-blue-500 px-3 py-1.5">
                  <Plus size={16} color="white" />
                  <Text className="ml-1 text-xs font-medium text-white">Add Alert</Text>
                </TouchableOpacity>
              </View>

              {/* Add New Threshold Form */}
              {showAddForm && (
                <View className="mb-4 rounded-lg border border-gray-200 bg-white p-3">
                  <Text className="mb-2 text-xs font-medium text-gray-600">Add New Alert</Text>

                  <View className="mb-3 flex-row space-x-2">
                    <TouchableOpacity
                      onPress={() => setNewThresholdType("above")}
                      className={`flex-1 rounded-md px-3 py-2 ${
                        newThresholdType === "above" ? "bg-blue-500" : "bg-gray-200"
                      }`}>
                      <Text
                        className={`text-center text-xs font-medium ${
                          newThresholdType === "above" ? "text-white" : "text-gray-700"
                        }`}>
                        Above
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => setNewThresholdType("below")}
                      className={`flex-1 rounded-md px-3 py-2 ${
                        newThresholdType === "below" ? "bg-blue-500" : "bg-gray-200"
                      }`}>
                      <Text
                        className={`text-center text-xs font-medium ${
                          newThresholdType === "below" ? "text-white" : "text-gray-700"
                        }`}>
                        Below
                      </Text>
                    </TouchableOpacity>
                  </View>

                  <View className="mb-3 flex-row items-center">
                    <Text className="mr-2 text-xs text-gray-600">€</Text>
                    <TextInput
                      value={newThresholdPrice}
                      onChangeText={setNewThresholdPrice}
                      placeholder="Enter price per MWh"
                      keyboardType="numeric"
                      className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm"
                    />
                    <Text className="ml-2 text-xs text-gray-600">/MWh</Text>
                  </View>

                  <View className="flex-row space-x-2">
                    <TouchableOpacity
                      onPress={() => setShowAddForm(false)}
                      className="flex-1 rounded-md bg-gray-200 px-3 py-2">
                      <Text className="text-center text-xs font-medium text-gray-700">Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={handleAddThreshold}
                      className="flex-1 rounded-md bg-blue-500 px-3 py-2">
                      <Text className="text-center text-xs font-medium text-white">Add Alert</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {/* Existing Thresholds */}
              {notifications.map((notification) => (
                <View
                  key={notification.id}
                  className="mb-2 flex-row items-center justify-between rounded-lg border border-gray-200 bg-white p-3">
                  <View className="flex-1">
                    <Text className="text-sm font-medium text-gray-700">
                      {notification.type === "above" ? "Above" : "Below"} €{notification.price}/MWh
                    </Text>
                    <Text className="text-xs text-gray-500">
                      {notification.type === "above"
                        ? "Alert when price goes above this threshold"
                        : "Alert when price goes below this threshold"}
                    </Text>
                  </View>
                  <View className="flex-row items-center space-x-2">
                    <Switch
                      value={notification.enabled}
                      onValueChange={() => toggleNotification(notification.id)}
                      trackColor={{ false: "#e5e7eb", true: "#3b82f6" }}
                      thumbColor={notification.enabled ? "#ffffff" : "#f3f4f6"}
                    />
                    <TouchableOpacity
                      onPress={() => handleRemoveThreshold(notification.id)}
                      className="p-1">
                      <Trash2 size={16} color="#ef4444" />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}

              {notifications.length === 0 && !showAddForm && (
                <Text className="text-center text-xs text-gray-500">
                  No price alerts configured. Tap "Add Alert" to create one.
                </Text>
              )}
            </View>
          )}

          {/* Background Monitoring Status */}
          {isNotificationsEnabled && (
            <View className="mt-4 rounded-lg bg-gray-50 p-4">
              <Text className="mb-2 text-sm font-medium text-gray-700">Background Monitoring</Text>
              <View className="flex-row items-center justify-between">
                <Text className="text-xs text-gray-600">Status: {backgroundFetchStatus}</Text>
                <View
                  className={`rounded-full px-2 py-1 ${
                    backgroundFetchStatus === "Available" ? "bg-green-100" : "bg-yellow-100"
                  }`}>
                  <Text
                    className={`text-xs font-medium ${
                      backgroundFetchStatus === "Available" ? "text-green-800" : "text-yellow-800"
                    }`}>
                    {backgroundFetchStatus === "Available" ? "Active" : "Limited"}
                  </Text>
                </View>
              </View>
              <Text className="mt-1 text-xs text-gray-500">
                {backgroundFetchStatus === "Available"
                  ? "Price monitoring is active in the background. You'll receive alerts even when the app is closed."
                  : "Background monitoring may be limited by your device settings. Alerts work best when the app is open."}
              </Text>
              {isNotificationsEnabled && (
                <TouchableOpacity
                  onPress={handleTestNotification}
                  className="mt-2 flex-row items-center justify-center rounded-md bg-blue-500 px-3 py-2">
                  <Bell size={16} color="white" />
                  <Text className="ml-2 text-xs font-medium text-white">
                    Send Test Notification
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>

        <View className="mb-6">
          <Text className="mb-4 text-lg font-semibold text-gray-900">About</Text>
          <View className="rounded-lg bg-gray-50 p-4">
            <Text className="mb-2 text-sm text-gray-600">Belgian Electricity Price Monitor</Text>
            <Text className="text-xs text-gray-500">
              View real-time day-ahead electricity prices from the Belgian electricity grid (Elia).
            </Text>
          </View>
        </View>

        <View className="mb-6">
          <Text className="mb-4 text-lg font-semibold text-gray-900">Data Source</Text>
          <View className="rounded-lg bg-gray-50 p-4">
            <Text className="mb-2 text-sm text-gray-600">Elia Grid Data</Text>
            <Text className="text-xs text-gray-500">
              Prices are fetched from Elia's public API and represent day-ahead auction results in
              €/MWh.
            </Text>
          </View>
        </View>

        <View className="mb-6">
          <Text className="mb-4 text-lg font-semibold text-gray-900">Update Frequency</Text>
          <View className="rounded-lg bg-gray-50 p-4">
            <Text className="mb-2 text-sm text-gray-600">Real-time</Text>
            <Text className="text-xs text-gray-500">
              Data is fetched when the app loads and shows current and next day prices.
            </Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}
