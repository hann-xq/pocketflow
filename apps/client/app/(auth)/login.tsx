import LoginForm from '@/components/auth/LoginForm';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'expo-router';
import { useState } from 'react';

export default function LoginScreen() {
  const { login } = useAuth();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(email: string, password: string) {
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
    <LoginForm
      error={error}
      loading={loading}
      onSubmit={handleSubmit}
      onNavigateToRegister={() => router.push('/(auth)/register')}
    />
  );
}
