import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRef, useState } from 'react';
import { ActivityIndicator, Image, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useAuth } from '@/lib/auth-context';

const logo = require('../assets/images/logo.png');

interface Props {
  onShowRegister: () => void;
}

export default function LoginScreen({ onShowRegister }: Props) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const passwordRef = useRef<TextInput>(null);

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
          returnKeyType="next"
          onSubmitEditing={() => passwordRef.current?.focus()}
        />

        <View className="flex-row items-center bg-surface border border-border rounded-xl pr-3">
          <TextInput
            ref={passwordRef}
            className="flex-1 px-4 py-3 text-tPrimary text-base"
            placeholder="Password"
            placeholderTextColor="#9ca3af"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            textContentType="password"
            accessibilityLabel="Password"
            returnKeyType="done"
            onSubmitEditing={handleLogin}
          />
          <TouchableOpacity
            onPress={() => setShowPassword((v) => !v)}
            accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
            accessibilityRole="button"
          >
            <MaterialCommunityIcons
              name={showPassword ? 'eye-off' : 'eye'}
              size={22}
              color="#9ca3af"
            />
          </TouchableOpacity>
        </View>

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

        <TouchableOpacity
          className="items-center mt-2"
          onPress={onShowRegister}
          accessibilityRole="button"
          accessibilityLabel="Create an account"
        >
          <Text className="text-tSecondary text-sm">
            Don&apos;t have an account?{' '}
            <Text className="text-primary font-semibold">Sign up</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
