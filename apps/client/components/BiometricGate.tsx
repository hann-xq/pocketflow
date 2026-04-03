import { Image, Text, TouchableOpacity, View } from 'react-native';
import logo from '../assets/images/logo.png';

interface Props {
  authFailed: boolean;
  onRetry: () => void;
}

export const BiometricGate = ({ authFailed, onRetry }: Props) => (
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
          onPress={onRetry}
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
