import { useAuth } from '@/lib/auth-context';
import { Redirect, Stack } from 'expo-router';

export default function AppLayout() {
  const { token } = useAuth();

  if (!token) {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="transactions/[id]" />
      <Stack.Screen name="transactions/create" />
      <Stack.Screen name="insights/[category]" />
      <Stack.Screen name="transactions/edit-tags" />
      <Stack.Screen name="transactions/by-tag" />
    </Stack>
  );
}
