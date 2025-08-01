import { Text, View } from "react-native";

export default function Settings() {
  return (
    <View className="flex-1 bg-white">
      {/* Settings Content */}
      <View className="flex-1 px-4 py-6">
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
    </View>
  );
}
