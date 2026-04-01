import { useAuth } from '@/lib/auth-context';
import { Redirect, Stack } from 'expo-router';

export default function AuthLayout() {
  const { token } = useAuth();

  if (token) {
    return <Redirect href="/(tabs)/insights" />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
