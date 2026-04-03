import { useEffect, useRef } from 'react';
import { onlineManager, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth-context';
import { flushPendingQueue } from '@/lib/pending-queue';

export function useSync() {
  const { userId, token } = useAuth();
  const queryClient = useQueryClient();
  const wasOnline = useRef(onlineManager.isOnline());

  useEffect(() => {
    if (userId === null || token === null) return;

    return onlineManager.subscribe(async () => {
      const isNowOnline = onlineManager.isOnline();

      if (!wasOnline.current && isNowOnline) {
        await flushPendingQueue(queryClient, userId!);

        await queryClient.invalidateQueries({ queryKey: ['transactions', userId] });
        await queryClient.invalidateQueries({ queryKey: ['bank-accounts', userId] });
        await queryClient.invalidateQueries({ queryKey: ['tags', userId] });
      }

      wasOnline.current = isNowOnline;
    });
  }, [userId, token, queryClient]);
}
