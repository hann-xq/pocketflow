import * as LocalAuthentication from 'expo-local-authentication';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useBiometricSettings } from './useBiometricSettings';

// Number of consecutive failures before the user is logged out.
const MAX_BIO_FAILURES = 3;

export function useBiometricGate() {
  const { logout } = useAuth();
  const { biometricEnabled, isLoaded } = useBiometricSettings();

  const [passed, setPassed] = useState(false);
  const [authFailed, setAuthFailed] = useState(false);

  const failCountRef = useRef(0);
  // logout is recreated on every AuthProvider render, so we use a ref to always
  // call the latest version without destabilising the authenticate callback.
  const logoutRef = useRef(logout);
  logoutRef.current = logout;

  // useCallback with [] keeps authenticate stable so that useEffect([authenticate])
  // runs only once on mount, not on every render.
  const authenticate = useCallback(async () => {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Use your fingerprint to continue',
      fallbackLabel: 'Use passcode',
      cancelLabel: 'Cancel',
      disableDeviceFallback: false,
    });

    if (result.success) {
      failCountRef.current = 0;
      setPassed(true);
      return;
    }

    failCountRef.current += 1;
    if (failCountRef.current >= MAX_BIO_FAILURES) {
      failCountRef.current = 0;
      await logoutRef.current();
      setPassed(true);
    } else {
      setAuthFailed(true);
    }
  }, []);

  useEffect(() => {
    if (!isLoaded || passed) return;

    if (!biometricEnabled) {
      setPassed(true);
      return;
    }

    void authenticate();
  }, [isLoaded, biometricEnabled, passed, authenticate]);

  return { passed, authFailed, authenticate };
}
