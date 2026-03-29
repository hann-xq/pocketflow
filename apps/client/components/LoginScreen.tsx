import { useState } from 'react';
import { ActivityIndicator, Image, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useAuth } from '@/lib/auth-context';

const logo = require('../assets/images/logo.png');

export default function LoginScreen() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    if (!email || !password) {
      setError('Please enter your email and password.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
    } catch (e: any) {
      setError(e?.message || 'Invalid credentials.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <View className="flex-1 bg-background justify-center p-8">
      <View className="items-center mb-8">
        <Image
          source={logo}
          className="w-36 h-36 mb-8"
          resizeMode="contain"
          accessible={true}
          accessibilityRole="image"
          accessibilityLabel="PocketFlow logo"
        />
        <Text className="text-2xl font-bold text-tPrimary mb-8 text-center" accessibilityRole="header">
          Welcome to PocketFlow
        </Text>
      </View>

      <View className="w-full self-stretch gap-4">
        <TextInput
          className="bg-surface border border-border rounded-xl px-4 py-3 text-tPrimary text-base"
          placeholder="Email"
          placeholderTextColor="#9ca3af"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          textContentType="emailAddress"
          accessibilityLabel="Email"
        />
        <TextInput
          className="bg-surface border border-border rounded-xl px-4 py-3 text-tPrimary text-base"
          placeholder="Password"
          placeholderTextColor="#9ca3af"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          textContentType="password"
          accessibilityLabel="Password"
        />

        {error && (
          <Text className="text-red-600 text-sm text-center" accessibilityRole="alert" accessibilityLiveRegion="assertive">
            {error}
          </Text>
        )}

        <TouchableOpacity
          className="bg-primary py-3.5 rounded-xl items-center mt-2"
          onPress={handleLogin}
          disabled={loading}
          accessibilityRole="button"
          accessibilityLabel="Sign in"
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white text-base font-semibold">Sign in</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}
