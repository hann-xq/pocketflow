import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api';
import type { ApiTransaction } from '@/lib/types';

export function useTransactions() {
  const { userId } = useAuth();

  return useQuery({
    queryKey: ['transactions', userId],
    queryFn: () => api.get<ApiTransaction[]>(`/users/${userId}/transactions`),
    enabled: userId !== null,
  });
}
