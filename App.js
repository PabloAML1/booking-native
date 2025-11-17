import { StatusBar } from "expo-status-bar";
import { Main } from "./components/Main";
import { SafeAreaProvider } from "react-native-safe-area-context";

import "./global.css";

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar style="auto" />
      <Main />
    </SafeAreaProvider>
  );
}
