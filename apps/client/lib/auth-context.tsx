import * as SecureStore from 'expo-secure-store';
import { createContext, useContext, useEffect, useState } from 'react';
import { api } from './api';

const TOKEN_KEY = 'auth_token';

function decodeUserId(token: string): string | null {
  try {
    const payload = token.split('.')[1];
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const decoded = JSON.parse(atob(base64));
    return decoded.sub ?? null;
  } catch {
    return null;
  }
}

type AuthContextType = {
  token: string | null;
  userId: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (firstName: string, lastName: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

type AuthProviderProps = {
  children: React.ReactNode;
  onLogout?: () => Promise<void>;
};

export function AuthProvider({ children, onLogout }: AuthProviderProps) {
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    SecureStore.getItemAsync(TOKEN_KEY).then((stored) => {
      if (stored) {
        api.applyToken(stored);
        setToken(stored);
      }
      setIsLoading(false);
    });
  }, []);

  async function login(email: string, password: string) {
    const { accessToken } = await api.post<{ accessToken: string }>('/tokens', { email, password });
    await SecureStore.setItemAsync(TOKEN_KEY, accessToken);
    api.applyToken(accessToken);
    setToken(accessToken);
  }

  async function register(firstName: string, lastName: string, email: string, password: string) {
    await api.post('/users', { firstName, lastName, email, password });
    await login(email, password);
  }

  async function logout() {
    await onLogout?.();

    await SecureStore.deleteItemAsync(TOKEN_KEY);
    api.applyToken(null);
    setToken(null);
  }

  return (
    <AuthContext.Provider value={{ token, userId: token ? decodeUserId(token) : null, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
