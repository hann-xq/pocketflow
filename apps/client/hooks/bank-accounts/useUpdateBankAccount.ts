import { randomUUID } from 'expo-crypto';
import { useQueryClient } from '@tanstack/react-query';

import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api';
import { db } from '@/db/client';
import { pendingOperations } from '@/db/schema';
import type { ApiBankAccount } from '@/lib/types';
import { useOfflineMutation } from '@/hooks/useOfflineMutation';

export type UpdateBankAccountInput = {
  id: string;
  accountName: string;
};

type UpdateBaContext = { previous: ApiBankAccount[] };

export function useUpdateBankAccount() {
  const queryClient = useQueryClient();
  const { userId } = useAuth();
  const key = ['bank-accounts', userId];

  return useOfflineMutation<UpdateBankAccountInput, ApiBankAccount, UpdateBaContext>({
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: key });

      const previous = queryClient.getQueryData<ApiBankAccount[]>(key) ?? [];
      queryClient.setQueryData<ApiBankAccount[]>(key, (old) =>
        (old ?? []).map((ba) => (ba.id === input.id ? { ...ba, accountName: input.accountName } : ba))
      );

      return { previous };
    },
    apiFn: (input) =>
      api.patch<ApiBankAccount>(`/bank-accounts/${input.id}`, { accountName: input.accountName }),
    onApiSuccess: (data, _input, _context) => {
      queryClient.setQueryData<ApiBankAccount[]>(key, (old) =>
        (old ?? []).map((ba) => (ba.id === data.id ? data : ba))
      );
    },
    onOfflineSuccess: async (input, _context) => {
      await db.insert(pendingOperations).values({
        id: randomUUID(),
        entityType: 'bank_account',
        entityId: input.id,
        operation: 'update',
        payload: JSON.stringify({ bankAccountId: input.id, body: { accountName: input.accountName } }),
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
