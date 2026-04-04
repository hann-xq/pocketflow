import { randomUUID } from 'expo-crypto';
import { useQueryClient } from '@tanstack/react-query';

import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api';
import { db } from '@/db/client';
import { pendingOperations } from '@/db/schema';
import type { ApiCategory, ApiTransaction, UpdateTransactionInput } from '@/lib/types';
import { useOfflineMutation } from '@/hooks/useOfflineMutation';

type UpdateTxContext = { previous: ApiTransaction[] };

function mapToApiBody(input: UpdateTransactionInput): Record<string, unknown> {
  const body: Record<string, unknown> = {};

  if (input.amount !== undefined) body.amount = input.amount;
  if (input.description !== undefined) body.description = input.description;
  if (input.counterpartyName !== undefined) body.counterpartyName = input.counterpartyName;
  if (input.counterpartyAccount !== undefined) body.counterpartyAccount = input.counterpartyAccount;
  if (input.categoryId !== undefined) body.categoryId = input.categoryId;

  return body;
}

export function useUpdateTransaction() {
  const queryClient = useQueryClient();
  const { userId } = useAuth();
  const key = ['transactions', userId];

  return useOfflineMutation<UpdateTransactionInput, ApiTransaction, UpdateTxContext>({
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: key });

      const previous = queryClient.getQueryData<ApiTransaction[]>(key) ?? [];
      const existing = previous.find((t) => t.id === input.id);

      if (existing !== undefined) {
        let category = existing.category;

        if (input.categoryId !== undefined) {
          const categories = queryClient.getQueryData<ApiCategory[]>(['categories']) ?? [];
          category = categories.find((c) => c.id === input.categoryId) ?? existing.category;
        }

        const updated: ApiTransaction = {
          ...existing,
          amount: input.amount !== undefined ? String(input.amount) : existing.amount,
          description: input.description !== undefined ? input.description : existing.description,
          counterpartyName: input.counterpartyName !== undefined ? input.counterpartyName : existing.counterpartyName,
          counterpartyAccount: input.counterpartyAccount !== undefined ? input.counterpartyAccount : existing.counterpartyAccount,
          categoryId: input.categoryId !== undefined ? input.categoryId : existing.categoryId,
          category,
        };
        queryClient.setQueryData<ApiTransaction[]>(key, (old) =>
          (old ?? []).map((tx) => (tx.id === input.id ? updated : tx))
        );
      }

      return { previous };
    },
    apiFn: (input) => api.patch<ApiTransaction>(`/transactions/${input.id}`, mapToApiBody(input)),
    onApiSuccess: (data, _input, _context) => {
      queryClient.setQueryData<ApiTransaction[]>(key, (old) =>
        (old ?? []).map((tx) => (tx.id === data.id ? data : tx))
      );
    },
    onOfflineSuccess: async (input, _context) => {
      await db.insert(pendingOperations).values({
        id: randomUUID(),
        entityType: 'transaction',
        entityId: input.id,
        operation: 'update',
        payload: JSON.stringify({ transactionId: input.id, body: mapToApiBody(input) }),
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
