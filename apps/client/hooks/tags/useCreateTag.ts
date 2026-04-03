import { randomUUID } from 'expo-crypto';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api';
import { db } from '@/db/client';
import { pendingOperations } from '@/db/schema';
import type { ApiTag } from '@/lib/types';
import { useOfflineMutation } from '@/hooks/useOfflineMutation';
import { validateTagName } from '@/lib/validation';

type CreateTagContext = { previous: ApiTag[]; tempId: string };

export function useCreateTag() {
  const queryClient = useQueryClient();
  const { userId } = useAuth();
  const key = ['tags', userId];

  return useOfflineMutation<string, ApiTag, CreateTagContext>({
    onMutate: async (name) => {
      const error = validateTagName(name);
      if (error !== null) {
        throw new Error(error);
      }

      await queryClient.cancelQueries({ queryKey: key });

      const tempId = randomUUID();
      const previous = queryClient.getQueryData<ApiTag[]>(key) ?? [];
      queryClient.setQueryData<ApiTag[]>(key, [...previous, { id: tempId, name, updatedAt: new Date().toISOString() }]);

      return { previous, tempId };
    },
    apiFn: (name) => api.post<ApiTag>('/tags', { name }),
    onApiSuccess: (data, _name, context) => {
      queryClient.setQueryData<ApiTag[]>(key, (old) =>
        (old ?? []).map((t) => (t.id === context.tempId ? data : t))
      );
    },
    onOfflineSuccess: async (name, context) => {
      await db.insert(pendingOperations).values({
        id: randomUUID(),
        entityType: 'tag',
        entityId: context.tempId,
        operation: 'create',
        payload: JSON.stringify({ body: { name } }),
        createdAt: new Date().toISOString(),
      });
    },
    onError: (_err, _name, context) => {
      if (context !== undefined) {
        queryClient.setQueryData(key, context.previous);
      }
    },
  });
}
