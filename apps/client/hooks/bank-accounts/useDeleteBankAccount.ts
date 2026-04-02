import { randomUUID } from 'expo-crypto';
import { useQueryClient } from '@tanstack/react-query';

import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api';
import { db } from '@/db/client';
import { pendingOperations } from '@/db/schema';
import type { ApiBankAccount } from '@/lib/types';
import { useOfflineMutation } from '@/hooks/useOfflineMutation';

type DeleteBaContext = { previous: ApiBankAccount[] };

export function useDeleteBankAccount() {
  const queryClient = useQueryClient();
  const { userId } = useAuth();
  const key = ['bank-accounts', userId];

  return useOfflineMutation<string, void, DeleteBaContext>({
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: key });

      const previous = queryClient.getQueryData<ApiBankAccount[]>(key) ?? [];
      queryClient.setQueryData<ApiBankAccount[]>(key, (old) => (old ?? []).filter((ba) => ba.id !== id));

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
    },
    onError: (_err, _input, context) => {
      if (context !== undefined) {
        queryClient.setQueryData(key, context.previous);
      }
    },
  });
}
