import { cssInterop } from "nativewind";
import { LineGraph } from "react-native-graph";

export function cssInteropAll() {
  cssInterop(LineGraph, { className: "style" });
}
