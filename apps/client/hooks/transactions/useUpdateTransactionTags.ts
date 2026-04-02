import { randomUUID } from 'expo-crypto';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api';
import { db } from '@/db/client';
import { pendingOperations } from '@/db/schema';
import type { ApiTransaction, UpdateTransactionTagsInput } from '@/lib/types';
import { useOfflineMutation } from '@/hooks/useOfflineMutation';

type UpdateTagsContext = { previous: ApiTransaction[] };

export function useUpdateTransactionTags() {
  const queryClient = useQueryClient();
  const { userId } = useAuth();
  const key = ['transactions', userId];

  return useOfflineMutation<UpdateTransactionTagsInput, ApiTransaction, UpdateTagsContext>({
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: key });

      const previous = queryClient.getQueryData<ApiTransaction[]>(key) ?? [];
      queryClient.setQueryData<ApiTransaction[]>(key, (old) =>
        (old ?? []).map((tx) => (tx.id === input.transactionId ? { ...tx, tags: input.tags } : tx))
      );

      return { previous };
    },
    apiFn: (input) =>
      api.patch<ApiTransaction>(`/transactions/${input.transactionId}`, {
        tagIds: input.tags.map((t) => t.id),
      }),
    onApiSuccess: (data, _input, _context) => {
      queryClient.setQueryData<ApiTransaction[]>(key, (old) =>
        (old ?? []).map((tx) => (tx.id === data.id ? data : tx))
      );
    },
    onOfflineSuccess: async (input, _context) => {
      await db.insert(pendingOperations).values({
        id: randomUUID(),
        entityType: 'transaction',
        entityId: input.transactionId,
        operation: 'update_tags',
        payload: JSON.stringify({
          transactionId: input.transactionId,
          body: { tagIds: input.tags.map((t) => t.id) },
        }),
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
