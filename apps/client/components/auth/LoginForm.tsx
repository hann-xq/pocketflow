import PasswordInput from '@/components/form/PasswordInput';
import { useState } from 'react';
import { ActivityIndicator, Image, Text, TextInput, TouchableOpacity, View } from 'react-native';
import logo from '../../assets/images/logo.png';

interface Props {
  error: string | null;
  loading: boolean;
  onSubmit: (email: string, password: string) => void;
  onNavigateToRegister: () => void;
}

export default function LoginForm({ error, loading, onSubmit, onNavigateToRegister }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

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
          className="border border-border rounded-xl px-4 py-3 text-tPrimary text-base"
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          textContentType="emailAddress"
          accessibilityLabel="Email"
        />

        <PasswordInput
          value={password}
          onChangeText={setPassword}
          accessibilityLabel="Password"
          onSubmitEditing={() => onSubmit(email, password)}
        />

        {error && (
          <Text
            className="text-red-600 text-sm text-center"
            accessibilityRole="alert"
            accessibilityLiveRegion="assertive"
          >
            {error}
          </Text>
        )}

        <TouchableOpacity
          className="bg-primary py-3.5 rounded-xl items-center mt-2"
          onPress={() => onSubmit(email, password)}
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
          onPress={onNavigateToRegister}
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
