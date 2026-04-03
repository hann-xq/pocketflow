import { randomUUID } from 'expo-crypto';
import { useQueryClient } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api';
import { db } from '@/db/client';
import { pendingOperations } from '@/db/schema';
import type { ApiTransaction } from '@/lib/types';
import { useOfflineMutation } from '@/hooks/useOfflineMutation';

type DeleteTxContext = { previous: ApiTransaction[] };

export function useDeleteTransaction() {
  const queryClient = useQueryClient();
  const { userId } = useAuth();
  const key = ['transactions', userId];

  return useOfflineMutation<string, void, DeleteTxContext>({
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: key });

      const previous = queryClient.getQueryData<ApiTransaction[]>(key) ?? [];
      queryClient.setQueryData<ApiTransaction[]>(key, (old) => (old ?? []).filter((tx) => tx.id !== id));
      queryClient.removeQueries({ queryKey: ['transaction', id, userId] });

      return { previous };
    },
    apiFn: (id) => api.delete<void>(`/transactions/${id}`),
    onApiSuccess: () => {
      Toast.show({ type: 'success', text1: 'Transaction deleted.' });
    },
    onOfflineSuccess: async (id, context) => {
      Toast.show({ type: 'success', text1: 'Transaction deleted.' });

      const deleted = context.previous.find((tx) => tx.id === id) ?? null;
      await db.insert(pendingOperations).values({
        id: randomUUID(),
        entityType: 'transaction',
        entityId: id,
        operation: 'delete',
        payload: JSON.stringify({ transactionId: id, backup: deleted }),
        createdAt: new Date().toISOString(),
      });

      queryClient.setQueryData<ApiTransaction[]>(key, (old) => (old ?? []).filter((tx) => tx.id !== id));
      queryClient.removeQueries({ queryKey: ['transaction', id, userId] });
    },
    onError: (_err, _input, context) => {
      if (context !== undefined) {
        queryClient.setQueryData(key, context.previous);
      }
    },
  });
}
