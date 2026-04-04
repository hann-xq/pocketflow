import { Switch, Text, View } from 'react-native';

interface Props {
  biometricEnabled: boolean;
  biometricAvailable: boolean;
  onToggleBiometric: (value: boolean) => void;
}

export function SettingsSection({ biometricEnabled, biometricAvailable, onToggleBiometric }: Props) {
  return (
    <View className="px-4">
      <Text className="font-semibold mb-2" style={{ fontSize: 22 }} accessibilityRole="header">
        Settings
      </Text>
      <View className="flex-row items-center justify-between py-3">
        <View className="flex-1 mr-4">
          <Text className="text-base text-tPrimary">Biometric Authentication</Text>
          {!biometricAvailable && (
            <Text className="text-sm text-tSecondary mt-0.5" accessibilityRole="text">
              No biometric option available on this device
            </Text>
          )}
        </View>
        <Switch
          value={biometricEnabled}
          onValueChange={onToggleBiometric}
          disabled={!biometricAvailable}
          accessibilityLabel="Biometric authentication"
          accessibilityRole="switch"
          accessibilityState={{ checked: biometricEnabled, disabled: !biometricAvailable }}
        />
      </View>
    </View>
  );
}
