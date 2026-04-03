import Toast from 'react-native-toast-message';
import * as LocalAuthentication from 'expo-local-authentication';
import { QueryClient, useIsRestoring } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { Stack } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, AppRegistry, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { MD3LightTheme, PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from "@/lib/auth-context";
import { configureOnlineManager } from "@/lib/network";
import { runMigrations } from "@/db/migrations";
import { sqlitePersister } from "@/lib/sqlite-persister";
import { useSync } from "@/hooks/useSync";
import { colors } from '@/lib/theme';
import { BiometricGate } from '@/components/BiometricGate';

import './global.css';

const paperTheme = {
  ...MD3LightTheme,
  colors: { ...MD3LightTheme.colors, primary: colors.primary, secondary: colors.secondary },
};


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
    return <BiometricGate authFailed={authFailed} onRetry={authenticate} />;
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
          <SafeAreaProvider>
            <PaperProvider theme={paperTheme}>
              <AppContent />
            </PaperProvider>
            <Toast />
          </SafeAreaProvider>
        </GestureHandlerRootView>
      </PersistQueryClientProvider>
    </AuthProvider>
  );
}


AppRegistry.registerComponent("PocketFlow", () => RootLayout);
