import { useEffect, useState } from "react";
import { ActivityIndicator, Dimensions, Text, View } from "react-native";
import { LineChart } from "react-native-gifted-charts";

interface PriceData {
  value: number;
  label?: string;
  date: Date;
  showVerticalLine?: boolean;
}

const formatDate = (date: Date) => {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export default function Index() {
  const [priceHistory, setPriceHistory] = useState<PriceData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchElectricityPrices = async () => {
    setLoading(true);
    setError(null);

    const currentDate = new Date();
    const nextDate = new Date();
    nextDate.setDate(currentDate.getDate() + 1);

    const currentUrl = `https://griddata.elia.be/eliabecontrols.prod/interface/Interconnections/daily/auctionresultsqh/${formatDate(
      currentDate
    )}`;
    const nextUrl = `https://griddata.elia.be/eliabecontrols.prod/interface/Interconnections/daily/auctionresultsqh/${formatDate(
      nextDate
    )}`;

    try {
      const [currentResponse, nextResponse] = await Promise.all([
        fetch(currentUrl),
        fetch(nextUrl),
      ]);

      let allPrices: any[] = [];

      if (currentResponse.ok) {
        try {
          const currentData = await currentResponse.json();
          allPrices = allPrices.concat(currentData);
        } catch (e) {
          console.log("Failed to parse current day data");
        }
      } else {
        console.log(`Failed to fetch data for ${formatDate(currentDate)}`);
      }

      if (nextResponse.ok) {
        try {
          const nextData = await nextResponse.json();
          allPrices = allPrices.concat(nextData);
        } catch (e) {
          console.log("Failed to parse next day data");
        }
      } else {
        console.log(`Failed to fetch data for ${formatDate(nextDate)}`);
      }

      if (allPrices.length === 0) {
        throw new Error(
          "Could not fetch electricity price data for today or tomorrow."
        );
      }

      const formattedData = allPrices.map((item: any) => {
        const date = new Date(item.dateTime);
        const isHour = date.getMinutes() === 0;
        return {
          value: item.price,
          label: isHour
            ? `${date.getHours().toString().padStart(2, "0")}:00`
            : undefined,
          date: date,
          showVerticalLine: isHour,
        };
      });

      setPriceHistory(formattedData);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "An unknown error occurred while fetching data."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchElectricityPrices();
  }, []);

  const { width } = Dimensions.get("window");

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" color="#4484B2" />
        <Text className="mt-4 text-gray-600">
          Loading electricity prices...
        </Text>
      </View>
    );
  }

  const minPrice =
    priceHistory.length > 0 ? Math.min(...priceHistory.map((p) => p.value)) : 0;
  const maxPrice =
    priceHistory.length > 0 ? Math.max(...priceHistory.map((p) => p.value)) : 0;
  const avgPrice =
    priceHistory.length > 0
      ? priceHistory.reduce((sum, p) => sum + p.value, 0) / priceHistory.length
      : 0;

  return (
    <View className="flex-1 bg-gray-50 pt-12">
      <View className="px-6 mb-6">
        <Text className="text-2xl font-bold text-gray-800 text-center">
          Day-Ahead Electricity Prices
        </Text>
        <Text className="text-lg text-gray-600 text-center mt-1">Belgium</Text>
      </View>

      {error && (
        <View className="mx-6 mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <Text className="text-red-700 text-sm text-center">{error}</Text>
        </View>
      )}

      {priceHistory.length > 0 ? (
        <View className="flex-1 px-4">
          {/* Statistics Cards */}
          <View className="flex-row justify-between mb-6 px-2">
            <View className="bg-white rounded-lg p-3 shadow-sm flex-1 mx-1">
              <Text className="text-xs text-gray-500 text-center">MIN</Text>
              <Text className="text-lg font-bold text-green-600 text-center">
                €{minPrice.toFixed(2)}
              </Text>
            </View>
            <View className="bg-white rounded-lg p-3 shadow-sm flex-1 mx-1">
              <Text className="text-xs text-gray-500 text-center">AVG</Text>
              <Text className="text-lg font-bold text-blue-600 text-center">
                €{avgPrice.toFixed(2)}
              </Text>
            </View>
            <View className="bg-white rounded-lg p-3 shadow-sm flex-1 mx-1">
              <Text className="text-xs text-gray-500 text-center">MAX</Text>
              <Text className="text-lg font-bold text-red-600 text-center">
                €{maxPrice.toFixed(2)}
              </Text>
            </View>
          </View>

          {/* Chart Container */}
          <View className="bg-white rounded-xl p-4 shadow-sm mx-2 mb-6">
            <LineChart
              data={priceHistory}
              width={width - 64}
              height={320}
              color="#4484B2"
              thickness={3}
              isAnimated={true}
              animationDuration={1200}
              showVerticalLines={false}
              verticalLinesColor="#f0f0f0"
              verticalLinesSpacing={Math.max(
                20,
                Math.floor((width - 120) / Math.max(priceHistory.length - 1, 1))
              )}
              spacing={Math.max(
                30,
                Math.floor((width - 120) / Math.max(priceHistory.length - 1, 1))
              )}
              initialSpacing={10}
              endSpacing={10}
              noOfSections={6}
              yAxisColor="#e0e0e0"
              xAxisColor="#e0e0e0"
              rulesColor="#f5f5f5"
              yAxisTextStyle={{
                color: "#666",
                fontSize: 11,
                fontWeight: "500",
              }}
              xAxisLabelTextStyle={{
                color: "#666",
                fontSize: 9,
                fontWeight: "500",
              }}
              yAxisLabelSuffix="€"
              dataPointsRadius={4}
              dataPointsColor="#4484B2"
              focusEnabled={true}
              showStripOnFocus={true}
              stripColor="#4484B2"
              stripOpacity={0.2}
              stripWidth={2}
              textShiftY={-8}
              textShiftX={-10}
              textColor="#333"
              textFontSize={12}
              yAxisOffset={0}
              labelsExtraHeight={20}
              xAxisTextNumberOfLines={2}
            />
          </View>

          {/* Footer Info */}
          <View className="px-4 pb-6">
            <Text className="text-xs text-gray-500 text-center">
              Prices shown in €/MWh • Data from Elia Grid
            </Text>
            <Text className="text-xs text-gray-400 text-center mt-1">
              Updated: {new Date().toLocaleTimeString()}
            </Text>
          </View>
        </View>
      ) : (
        <View className="flex-1 justify-center items-center px-6">
          <Text className="text-gray-500 text-center text-lg">
            No electricity price data available
          </Text>
          <Text className="text-gray-400 text-center text-sm mt-2">
            Please check your internet connection and try again
          </Text>
        </View>
      )}
    </View>
  );
}
