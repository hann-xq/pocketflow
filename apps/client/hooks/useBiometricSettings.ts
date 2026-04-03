import * as SecureStore from 'expo-secure-store';
import * as LocalAuthentication from 'expo-local-authentication';
import { useCallback, useEffect, useState } from 'react';

const BIOMETRIC_ENABLED_KEY = 'biometric_enabled';

export function useBiometricSettings() {
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    async function load() {
      const [hasHardware, isEnrolled, stored] = await Promise.all([
        LocalAuthentication.hasHardwareAsync(),
        LocalAuthentication.isEnrolledAsync(),
        SecureStore.getItemAsync(BIOMETRIC_ENABLED_KEY),
      ]);

      const available = hasHardware && isEnrolled;
      setBiometricAvailable(available);
      setBiometricEnabled(available && stored === 'true');

      setIsLoaded(true);
    }

    void load();
  }, []);

  const toggleBiometric = useCallback(async (value: boolean) => {
    if (value) {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Verify your identity to enable biometric authentication',
        cancelLabel: 'Cancel',
        disableDeviceFallback: false,
      });

      if (!result.success) return;
    }

    setBiometricEnabled(value);

    await SecureStore.setItemAsync(BIOMETRIC_ENABLED_KEY, value ? 'true' : 'false');
  }, []);

  return { biometricEnabled, biometricAvailable, isLoaded, toggleBiometric };
}
