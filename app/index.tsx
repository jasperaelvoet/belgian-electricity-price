import { useEffect, useState } from "react";
import { ActivityIndicator, Dimensions, LayoutChangeEvent, Text, View } from "react-native";
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
  const [chartWidth, setChartWidth] = useState(0);
  const [chartHeight, setChartHeight] = useState(0);

  const onLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setChartWidth(width - 64);
    setChartHeight(height - 96);
  };

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
        throw new Error("Could not fetch electricity price data for today or tomorrow.");
      }

      const formattedData = allPrices.map((item: any) => {
        const date = new Date(item.dateTime);
        const isHour = date.getMinutes() === 0;
        return {
          value: item.price,
          label: isHour ? `${date.getHours().toString().padStart(2, "0")}:00` : undefined,
          date: date,
          showVerticalLine: isHour,
        };
      });

      setPriceHistory(formattedData);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unknown error occurred while fetching data."
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
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color="#4484B2" />
        <Text className="mt-4 text-gray-600">Loading electricity prices...</Text>
      </View>
    );
  }

  const minPrice = priceHistory.length > 0 ? Math.min(...priceHistory.map((p) => p.value)) : 0;
  const maxPrice = priceHistory.length > 0 ? Math.max(...priceHistory.map((p) => p.value)) : 0;
  const avgPrice =
    priceHistory.length > 0
      ? priceHistory.reduce((sum, p) => sum + p.value, 0) / priceHistory.length
      : 0;

  return (
    <View className="flex-1 bg-gray-50 pt-12">
      <View className="mb-6 px-6">
        <Text className="text-center text-2xl font-bold text-gray-800">
          Day-Ahead Electricity Prices
        </Text>
        <Text className="mt-1 text-center text-lg text-gray-600">Belgium</Text>
      </View>

      {error && (
        <View className="mx-6 mb-4 rounded-lg border border-red-200 bg-red-50 p-4">
          <Text className="text-center text-sm text-red-700">{error}</Text>
        </View>
      )}

      {priceHistory.length > 0 ? (
        <View className="flex-1 px-4">
          {/* Statistics Cards */}
          <View className="mb-6 flex-row justify-between px-2">
            <View className="mx-1 flex-1 rounded-lg bg-white p-3 shadow-sm">
              <Text className="text-center text-xs text-gray-500">MIN</Text>
              <Text className="text-center text-lg font-bold text-green-600">
                €{minPrice.toFixed(2)}
              </Text>
            </View>
            <View className="mx-1 flex-1 rounded-lg bg-white p-3 shadow-sm">
              <Text className="text-center text-xs text-gray-500">AVG</Text>
              <Text className="text-center text-lg font-bold text-blue-600">
                €{avgPrice.toFixed(2)}
              </Text>
            </View>
            <View className="mx-1 flex-1 rounded-lg bg-white p-3 shadow-sm">
              <Text className="text-center text-xs text-gray-500">MAX</Text>
              <Text className="text-center text-lg font-bold text-red-600">
                €{maxPrice.toFixed(2)}
              </Text>
            </View>
          </View>

          {/* Chart Container */}
          <View
            className="mx-2 mb-6 flex flex-1 items-center justify-center rounded-xl bg-white shadow-sm"
            onLayout={onLayout}>
            {chartWidth > 0 && chartHeight > 0 && (
              <LineChart
                width={chartWidth}
                height={chartHeight}
                data={priceHistory}
                color="#4484B2"
                thickness={3}
                isAnimated={true}
                animationDuration={1200}
                showVerticalLines={false}
                verticalLinesColor="#f0f0f0"
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
            )}
          </View>

          {/* Footer Info */}
          <View className="px-4 pb-6">
            <Text className="text-center text-xs text-gray-500">
              Prices shown in €/MWh • Data from Elia Grid
            </Text>
            <Text className="mt-1 text-center text-xs text-gray-400">
              Updated: {new Date().toLocaleTimeString()}
            </Text>
          </View>
        </View>
      ) : (
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-center text-lg text-gray-500">
            No electricity price data available
          </Text>
          <Text className="mt-2 text-center text-sm text-gray-400">
            Please check your internet connection and try again
          </Text>
        </View>
      )}
    </View>
  );
}
