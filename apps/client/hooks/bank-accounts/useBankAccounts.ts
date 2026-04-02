import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api';
import type { ApiBankAccount } from '@/lib/types';

export function useBankAccounts() {
  const { userId } = useAuth();

  return useQuery({
    queryKey: ['bank-accounts', userId],
    queryFn: () => api.get<ApiBankAccount[]>(`/users/${userId}/bank-accounts`),
    enabled: userId !== null,
  });
}
