import { AuthProvider, useAuth } from "@/lib/auth-context";
import { configureOnlineManager } from "@/lib/network";
import { runMigrations } from "@/db/migrations";
import { sqlitePersister } from "@/lib/sqlite-persister";
import { useSync } from "@/hooks/useSync";
import { QueryClient, useIsRestoring } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import * as LocalAuthentication from 'expo-local-authentication';
import { Stack } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, AppRegistry, Image, Text, TouchableOpacity, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { PaperProvider } from 'react-native-paper';

import './global.css';
import logo from '../assets/images/logo.png';

configureOnlineManager();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      networkMode: 'always',
      staleTime: 5 * 60 * 1000,
      refetchOnReconnect: false,
      retry: false,
    },
    mutations: { networkMode: 'always' },
  },
});

function AppContent() {
  const { isLoading: tokenLoading } = useAuth();
  const [bioPassed, setBioPassed] = useState(false);
  const [authFailed, setAuthFailed] = useState(false);
  const isRestoring = useIsRestoring();

  useSync();

  useEffect(() => {
    authenticate();
  }, []);

  async function authenticate() {
    setAuthFailed(false);
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();

    if (!hasHardware || !isEnrolled) {
      setBioPassed(true);
      return;
    }
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: "Use your fingerprint to continue",
      fallbackLabel: "Use passcode",
      cancelLabel: "Cancel",
      disableDeviceFallback: false,
    });

    if (result.success) {
      setBioPassed(true);
    } else {
      setAuthFailed(true);
    }
  }

  if (!bioPassed) {
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

  if (tokenLoading || isRestoring) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(app)" />
      <Stack.Screen name="index" />
    </Stack>
  );
}

export default function RootLayout() {
  const [dbReady, setDbReady] = useState(false);

  useEffect(() => {
    runMigrations().then(() => setDbReady(true));
  }, []);

  if (!dbReady) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <AuthProvider>
      <PersistQueryClientProvider
        client={queryClient}
        persistOptions={{ persister: sqlitePersister, maxAge: 7 * 24 * 60 * 60 * 1000 }}
      >
        <GestureHandlerRootView>
          <PaperProvider>
            <AppContent />
          </PaperProvider>
        </GestureHandlerRootView>
      </PersistQueryClientProvider>
    </AuthProvider>
  );
}


AppRegistry.registerComponent("PocketFlow", () => RootLayout);
