import { initDatabase, seedDatabase } from "@/database/database";
import * as LocalAuthentication from 'expo-local-authentication';
import { Stack } from "expo-router";
import { useEffect, useState } from "react";
import { AppRegistry, Image, Text, TouchableOpacity, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { PaperProvider } from 'react-native-paper';
import './global.css';

const logo = require('../assets/images/logo.png');

export default function RootLayout() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authFailed, setAuthFailed] = useState(false);

  useEffect(() => {
    async function setup() {
      await initDatabase();
      await seedDatabase();
    }
    setup();
    authenticate();
  }, []);

  async function authenticate() {
    setAuthFailed(false);
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();

    console.log(hasHardware, isEnrolled);
    if (!hasHardware || !isEnrolled) {
      setIsAuthenticated(true);
      return;
    }
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: "Use your fingerprint to continue",
      fallbackLabel: "Use passcode",
      cancelLabel: "Cancel",
      disableDeviceFallback: false,
    });

    if (result.success) {
      setIsAuthenticated(true);
    } else {
      setAuthFailed(true);
    }
  }

  if (!isAuthenticated) {
    return (
      <View className="flex-1 bg-background items-center justify-center p-8">
        <Image
          source={logo}
          className="w-36 h-36 mb-8"
          resizeMode="contain"
          accessible={true}
          accessibilityRole="image"
          accessibilityLabel="PocketFlow logo"
        />
        <Text className="text-2xl font-bold text-tPrimary mb-3 text-center" accessibilityRole="header">Authentication Required</Text>
        {authFailed ? (
          <>
            <Text
              className="text-base text-red-600 text-center mb-6"
              accessibilityRole="alert"
              accessibilityLiveRegion="assertive"
            >
              Authentication required
            </Text>
            <TouchableOpacity
              className="bg-primary px-8 py-3.5 rounded-xl"
              onPress={authenticate}
              accessibilityRole="button"
              accessibilityLabel="Try again"
              accessibilityHint="Retry biometric or passcode authentication"
            >
              <Text className="text-white text-base font-semibold">Try Again</Text>
            </TouchableOpacity>
          </>
        ) : (
          <Text className="text-base text-tSecondary text-center" accessibilityLiveRegion="polite">
            Please verify your identity to continue
          </Text>
        )}
      </View>
    );
  }

  return (
    <GestureHandlerRootView>
      <PaperProvider>
        <Stack>
          <Stack.Screen
            name="(tabs)"
            options={{ headerShown: false }}
          />
        </Stack>
      </PaperProvider>
    </GestureHandlerRootView>
  );
}


AppRegistry.registerComponent("PocketFlow", () => RootLayout);
