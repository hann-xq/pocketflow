import Toast from 'react-native-toast-message';
import { QueryClient, useIsRestoring } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { Stack } from "expo-router";
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from "react";
import { ActivityIndicator, AppRegistry, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { MD3LightTheme, PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from "@/lib/auth-context";
import { configureOnlineManager } from "@/lib/network";
import { db } from "@/db/client";
import { pendingOperations } from "@/db/schema";
import { runMigrations } from "@/db/migrations";
import { sqlitePersister } from "@/lib/sqlite-persister";
import { useSync } from "@/hooks/useSync";
import { useBiometricGate } from "@/hooks/useBiometricGate";
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
      staleTime: Infinity,
      refetchOnReconnect: false,
      retry: false,
    },
    mutations: { networkMode: 'always' },
  },
});

function AppContent() {
  const { isLoading: tokenLoading } = useAuth();
  const isRestoring = useIsRestoring();
  const { passed, authFailed, authenticate } = useBiometricGate();

  useSync();

  if (tokenLoading || isRestoring) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!passed) {
    return <BiometricGate authFailed={authFailed} onRetry={authenticate} />;
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

  const onLogout = async () => {
    queryClient.clear();
    await sqlitePersister.removeClient();
    await db.delete(pendingOperations);
  };

  return (
    <AuthProvider onLogout={onLogout}>
      <PersistQueryClientProvider
        client={queryClient}
        persistOptions={{ persister: sqlitePersister, maxAge: 7 * 24 * 60 * 60 * 1000 }}
      >
        <GestureHandlerRootView>
          <SafeAreaProvider>
            <StatusBar style="dark" />
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
