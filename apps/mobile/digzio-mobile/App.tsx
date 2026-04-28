import "react-native-gesture-handler";
import React, { useEffect, useState } from "react";
import { StatusBar } from "expo-status-bar";
import { NavigationContainer } from "@react-navigation/native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import * as SplashScreen from "expo-splash-screen";
import * as Font from "expo-font";
import { View, ActivityIndicator } from "react-native";
import { AppNavigator } from "./src/navigation";
import { Colors } from "./src/theme";

SplashScreen.preventAutoHideAsync();

export default function App() {
  const [fontsLoaded, setFontsLoaded] = useState(false);

  useEffect(() => {
    async function loadFonts() {
      try {
        await Font.loadAsync({
          "SpaceGrotesk-Regular": require("./assets/fonts/SpaceGrotesk-Regular.ttf"),
          "SpaceGrotesk-Medium": require("./assets/fonts/SpaceGrotesk-Medium.ttf"),
          "SpaceGrotesk-SemiBold": require("./assets/fonts/SpaceGrotesk-SemiBold.ttf"),
          "SpaceGrotesk-Bold": require("./assets/fonts/SpaceGrotesk-Bold.ttf"),
          "SpaceGrotesk-ExtraBold": require("./assets/fonts/SpaceGrotesk-ExtraBold.ttf"),
        });
      } catch (e) {
        console.warn("Font loading error:", e);
      } finally {
        setFontsLoaded(true);
        await SplashScreen.hideAsync();
      }
    }
    loadFonts();
  }, []);

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: Colors.navy }}>
        <ActivityIndicator size="large" color={Colors.teal} />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <StatusBar style="light" />
        <AppNavigator />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
