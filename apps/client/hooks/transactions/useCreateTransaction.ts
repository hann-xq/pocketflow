import { randomUUID } from 'expo-crypto';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api';
import { db } from '@/db/client';
import { pendingOperations } from '@/db/schema';
import type { ApiTransaction, CreateTransactionInput } from '@/lib/types';
import { buildOptimisticTransaction } from '@/lib/cache-helpers';
import { validateTransaction } from '@/lib/validation';
import { useOfflineMutation } from '@/hooks/useOfflineMutation';

type CreateTxContext = { previous: ApiTransaction[]; tempId: string };

function mapToApiBody(input: CreateTransactionInput): Record<string, unknown> {
  const body: Record<string, unknown> = {
    amount: input.amount,
    date: input.date,
    categoryId: input.categoryId,
  };

  if (input.description !== null) body.description = input.description;
  if (input.counterpartyName !== null) body.counterpartyName = input.counterpartyName;
  if (input.counterpartyAccount !== null) body.counterpartyAccount = input.counterpartyAccount;

  return body;
}

export function useCreateTransaction() {
  const queryClient = useQueryClient();
  const { userId } = useAuth();
  const key = ['transactions', userId];

  return useOfflineMutation<CreateTransactionInput, ApiTransaction, CreateTxContext>({
    onMutate: async (input) => {
      const error = validateTransaction(input);
      if (error !== null) {
        throw new Error(error);
      }

      await queryClient.cancelQueries({ queryKey: key });

      const tempId = randomUUID();
      const previous = queryClient.getQueryData<ApiTransaction[]>(key) ?? [];
      const optimistic = buildOptimisticTransaction(input, tempId, userId!, queryClient);
      queryClient.setQueryData<ApiTransaction[]>(key, [optimistic, ...previous]);

      return { previous, tempId };
    },
    apiFn: (input) =>
      api.post<ApiTransaction>(`/bank-accounts/${input.bankAccountId}/transactions`, mapToApiBody(input)),
    onApiSuccess: (data, _input, context) => {
      queryClient.setQueryData<ApiTransaction[]>(key, (old) =>
        (old ?? []).map((tx) => (tx.id === context.tempId ? data : tx))
      );
    },
    onOfflineSuccess: async (input, context) => {
      await db.insert(pendingOperations).values({
        id: randomUUID(),
        entityType: 'transaction',
        entityId: context.tempId,
        operation: 'create',
        payload: JSON.stringify({ bankAccountId: input.bankAccountId, body: mapToApiBody(input) }),
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
