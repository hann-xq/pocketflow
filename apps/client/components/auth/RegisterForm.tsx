import PasswordInput from '@/components/form/PasswordInput';
import { useRef, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';


interface Props {
  error: string | null;
  loading: boolean;
  onSubmit: (firstName: string, lastName: string, email: string, password: string, confirmPassword: string) => void;
  onNavigateToLogin: () => void;
}

export default function RegisterForm({ error, loading, onSubmit, onNavigateToLogin }: Props) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const lastNameRef = useRef<TextInput>(null);
  const emailRef = useRef<TextInput>(null);

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-background"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 32 }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="items-center mb-8">
          <Text className="text-2xl font-bold text-tPrimary text-center" accessibilityRole="header">
            Create Account
          </Text>
          <Text className="text-sm text-tSecondary mt-2 text-center">
            Sign up to get started with PocketFlow
          </Text>
        </View>

        <View className="w-full gap-4">
          <View className="flex-row gap-3">
            <TextInput
              className="flex-1 border border-border rounded-xl px-4 py-3 text-tPrimary text-base"
              placeholder="First name"
              value={firstName}
              onChangeText={setFirstName}
              autoCapitalize="words"
              textContentType="givenName"
              accessibilityLabel="First name"
              returnKeyType="next"
              onSubmitEditing={() => lastNameRef.current?.focus()}
              submitBehavior="submit"
            />
            <TextInput
              ref={lastNameRef}
              className="flex-1 border border-border rounded-xl px-4 py-3 text-tPrimary text-base"
              placeholder="Last name"
              value={lastName}
              onChangeText={setLastName}
              autoCapitalize="words"
              textContentType="familyName"
              accessibilityLabel="Last name"
              returnKeyType="next"
              onSubmitEditing={() => emailRef.current?.focus()}
              submitBehavior="submit"
            />
          </View>

          <TextInput
            ref={emailRef}
            className="border border-border rounded-xl px-4 py-3 text-tPrimary text-base"
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            textContentType="emailAddress"
            accessibilityLabel="Email"
            submitBehavior="submit"
          />

          <PasswordInput
            value={password}
            onChangeText={setPassword}
            accessibilityLabel="Password"
          />

          <PasswordInput
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            accessibilityLabel="Confirm password"
            placeholder="Confirm password"
            onSubmitEditing={() => onSubmit(firstName, lastName, email, password, confirmPassword)}
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
            onPress={() => onSubmit(firstName, lastName, email, password, confirmPassword)}
            disabled={loading}
            accessibilityRole="button"
            accessibilityLabel="Create account"
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white text-base font-semibold">Create account</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            className="items-center mt-2"
            onPress={onNavigateToLogin}
            accessibilityRole="button"
            accessibilityLabel="Back to sign in"
          >
            <Text className="text-tSecondary text-sm">
              Already have an account?{' '}
              <Text className="text-primary font-semibold">Sign in</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
