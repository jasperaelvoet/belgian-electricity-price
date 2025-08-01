import { checkPriceThresholds, getCurrentPrice } from "@/lib/notificationService";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useState } from "react";
import { ActivityIndicator, Dimensions, LayoutChangeEvent, Text, View } from "react-native";
import { CurveType, LineChart } from "react-native-gifted-charts";

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
  const [pointerLabelWidth, setPointerLabelWidth] = useState(0);

  const onLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setChartWidth(width);
    // Subtract space for statistics cards (~80px) and footer (~60px) plus some padding
    setChartHeight(height - 200);
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
        const isHalfHour = date.getMinutes() === 0 || date.getMinutes() === 30;
        return {
          value: item.price,
          label: isHalfHour
            ? `${date.getHours().toString().padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}`
            : undefined,
          date: date,
        };
      });

      setPriceHistory(formattedData);

      // Check price thresholds for notifications
      const currentPrice = getCurrentPrice(formattedData);
      if (currentPrice !== null) {
        checkPriceThresholds(currentPrice);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unknown error occurred while fetching data."
      );
    } finally {
      setLoading(false);
      setTimeout(() => {
        SplashScreen.hideAsync();
      }, 250);
    }
  };

  useEffect(() => {
    fetchElectricityPrices();
  }, []);

  const { width } = Dimensions.get("window");

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color="#EA580C" />
        <Text className="mt-4 text-gray-600">Loading electricity prices...</Text>
      </View>
    );
  }

  const minPrice = priceHistory.length > 0 ? Math.min(...priceHistory.map((p) => p.value)) : 0;
  const maxPrice = priceHistory.length > 0 ? Math.max(...priceHistory.map((p) => p.value)) : 0;

  const getCurrentDataPoint = () => {
    if (priceHistory.length === 0) return null;

    const now = new Date();
    let closestIndex = -1;
    let smallestDiff = Infinity;

    for (let i = 0; i < priceHistory.length; i++) {
      const diff = Math.abs(now.getTime() - priceHistory[i].date.getTime());
      if (diff < smallestDiff) {
        smallestDiff = diff;
        closestIndex = i;
      }
    }

    if (closestIndex === -1) return null;

    return {
      index: closestIndex,
      price: priceHistory[closestIndex].value,
    };
  };

  const currentDataPoint = getCurrentDataPoint();
  const currentPrice = currentDataPoint ? currentDataPoint.price : 0;
  const currentPriceIndex = currentDataPoint ? currentDataPoint.index : -1;

  // Filter data to include 3 previous, current, and all future data points
  const filteredPriceHistory = priceHistory.filter((_, index) => {
    if (currentPriceIndex === -1) return true; // Show all data if current point not found
    return index >= Math.max(0, currentPriceIndex - 3); // Show 3 previous, current, and all future data points
  });

  const chartDataWithIndicator = filteredPriceHistory.map((point) => {
    // Find the original index in the full priceHistory array
    const originalIndex = priceHistory.findIndex((p) => p.date.getTime() === point.date.getTime());
    if (originalIndex === currentPriceIndex) {
      return {
        ...point,
        showVerticalLine: true,
        verticalLineColor: "black",
        verticalLineThickness: 2,
        labelComponent: () => (
          <View className="translate-x-1 rounded-lg bg-black p-2">
            <Text className="text-center text-xs font-medium text-white">NOW</Text>
          </View>
        ),
      };
    }
    return point;
  });

  return (
    <View className="flex-1 bg-white pt-6">
      {error && (
        <View className="mx-6 mb-4 rounded-lg border border-orange-200 bg-orange-50 p-4">
          <Text className="text-center text-sm text-orange-700">{error}</Text>
        </View>
      )}

      {priceHistory.length > 0 ? (
        <View className="flex-1 px-4" onLayout={onLayout}>
          {/* Statistics Cards */}
          <View className="mb-2 flex-row justify-between px-2">
            <View className="mx-1 flex-1 rounded-lg bg-white p-3 shadow-sm">
              <Text className="text-center text-xs text-gray-500">MIN</Text>
              <Text className="text-center text-lg font-bold text-green-600">
                €{minPrice.toFixed(2)}
              </Text>
            </View>
            <View className="mx-1 flex-1 rounded-lg bg-white p-3 shadow-sm">
              <Text className="text-center text-xs text-gray-500">CURRENT</Text>
              <Text className="text-center text-lg font-bold text-orange-600">
                €{currentPrice.toFixed(2)}
              </Text>
            </View>
            <View className="mx-1 flex-1 rounded-lg bg-white p-3 shadow-sm">
              <Text className="text-center text-xs text-gray-500">MAX</Text>
              <Text className="text-center text-lg font-bold text-orange-700">
                €{maxPrice.toFixed(2)}
              </Text>
            </View>
          </View>

          {/* Chart */}
          {chartWidth > 0 && chartHeight > 0 && (
            <LineChart
              width={chartWidth}
              height={chartHeight}
              data={chartDataWithIndicator}
              color="#EA580C"
              thickness={3}
              isAnimated={true}
              animationDuration={1200}
              showVerticalLines={true}
              verticalLinesColor="#f0f0f0"
              initialSpacing={10}
              endSpacing={10}
              areaChart
              startFillColor="#EA580C"
              endFillColor="#FED7AA"
              startOpacity1={1}
              endOpacity1={1}
              curved
              curvature={1}
              curveType={CurveType.QUADRATIC}
              noOfSections={3}
              scrollToEnd={false}
              disableScroll={false}
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
              dataPointsRadius={0}
              dataPointsColor="#EA580C"
              labelsExtraHeight={0}
              xAxisTextNumberOfLines={2}
              pointerConfig={{
                pointerStripHeight: chartHeight,
                pointerStripColor: "rgba(0, 0, 0, 0.2)",
                pointerStripWidth: 2,
                pointerColor: "black",
                autoAdjustPointerLabelPosition: true,
                radius: 5,
                pointerLabelWidth: -1,
                pointerLabelComponent: (items: any) => (
                  <View
                    onLayout={(event) => {
                      const { width } = event.nativeEvent.layout;
                      setPointerLabelWidth(width);
                    }}
                    style={{
                      backgroundColor: "black",
                      paddingHorizontal: 8,
                      paddingVertical: 4,
                      borderRadius: 4,
                      opacity: pointerLabelWidth > 0 ? 1 : 0,
                      transform: [{ translateX: -pointerLabelWidth / 2 }, { translateY: -20 }],
                    }}>
                    <Text style={{ color: "white", fontSize: 11, fontWeight: "500" }}>
                      €{items[0].value.toFixed(2)}
                    </Text>
                  </View>
                ),
              }}
            />
          )}

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
