import { randomUUID } from 'expo-crypto';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api';
import { db } from '@/db/client';
import { pendingOperations } from '@/db/schema';
import type { ApiBankAccount } from '@/lib/types';
import { useOfflineMutation } from '@/hooks/useOfflineMutation';
import { validateBankAccount } from '@/lib/validation';

export type CreateBankAccountInput = {
  accountName: string;
  accountNumber: string;
};

type CreateBaContext = { previous: ApiBankAccount[]; tempId: string };

export function useCreateBankAccount() {
  const queryClient = useQueryClient();
  const { userId } = useAuth();
  const key = ['bank-accounts', userId];

  return useOfflineMutation<CreateBankAccountInput, ApiBankAccount, CreateBaContext>({
    onMutate: async (input) => {
      const error = validateBankAccount(input);
      if (error !== null) {
        throw new Error(error);
      }

      const tempId = randomUUID();
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<ApiBankAccount[]>(key) ?? [];

      const optimistic: ApiBankAccount = {
        id: tempId,
        accountName: input.accountName,
        accountNumber: input.accountNumber,
        connectionType: null,
        updatedAt: new Date().toISOString(),
      };
      queryClient.setQueryData<ApiBankAccount[]>(key, [...previous, optimistic]);

      return { previous, tempId };
    },
    apiFn: (input) => api.post<ApiBankAccount>(`/users/${userId}/bank-accounts`, input),
    onApiSuccess: (data, _input, context) => {
      queryClient.setQueryData<ApiBankAccount[]>(key, (old) =>
        (old ?? []).map((ba) => (ba.id === context.tempId ? data : ba))
      );
    },
    onOfflineSuccess: async (input, context) => {
      await db.insert(pendingOperations).values({
        id: randomUUID(),
        entityType: 'bank_account',
        entityId: context.tempId,
        operation: 'create',
        payload: JSON.stringify({ userId, body: input }),
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
