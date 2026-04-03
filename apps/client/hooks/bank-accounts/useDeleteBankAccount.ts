import { randomUUID } from 'expo-crypto';
import { useQueryClient } from '@tanstack/react-query';

import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api';
import { db } from '@/db/client';
import { pendingOperations } from '@/db/schema';
import type { ApiBankAccount, ApiTransaction } from '@/lib/types';
import { useOfflineMutation } from '@/hooks/useOfflineMutation';

type DeleteBaContext = { previous: ApiBankAccount[] };

export function useDeleteBankAccount() {
  const queryClient = useQueryClient();
  const { userId } = useAuth();

  const key = ['bank-accounts', userId];
  const txKey = ['transactions', userId];

  return useOfflineMutation<string, void, DeleteBaContext>({
    onMutate: async (id) => {
      await Promise.all([
        queryClient.cancelQueries({ queryKey: key }),
        queryClient.cancelQueries({ queryKey: txKey }),
      ]);

      const previous = queryClient.getQueryData<ApiBankAccount[]>(key) ?? [];
      queryClient.setQueryData<ApiBankAccount[]>(key, (old) => (old ?? []).filter((ba) => ba.id !== id));
      queryClient.setQueryData<ApiTransaction[]>(txKey, (old) => (old ?? []).filter((tx) => tx.bankAccountId !== id));

      return { previous };
    },
    apiFn: (id) => api.delete<void>(`/bank-accounts/${id}`),
    onApiSuccess: () => {},
    onOfflineSuccess: async (id, context) => {
      const deleted = context.previous.find((ba) => ba.id === id) ?? null;
      await db.insert(pendingOperations).values({
        id: randomUUID(),
        entityType: 'bank_account',
        entityId: id,
        operation: 'delete',
        payload: JSON.stringify({ bankAccountId: id, backup: deleted }),
        createdAt: new Date().toISOString(),
      });

      queryClient.setQueryData<ApiBankAccount[]>(key, (old) => (old ?? []).filter((ba) => ba.id !== id));
      queryClient.setQueryData<ApiTransaction[]>(txKey, (old) => (old ?? []).filter((tx) => tx.bankAccountId !== id));
    },
    onError: (_err, _input, context) => {
      if (context !== undefined) {
        queryClient.setQueryData(key, context.previous);
      }
    },
  });
}
