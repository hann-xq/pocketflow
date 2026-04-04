import { Alert } from 'react-native';
import { onlineManager, type QueryClient } from '@tanstack/react-query';
import { eq } from 'drizzle-orm';
import { api } from '@/lib/api';
import { db } from '@/db/client';
import { pendingOperations } from '@/db/schema';
import type { ApiBankAccount, ApiTag, ApiTransaction } from '@/lib/types';

type BaseEntity = { id: string; updatedAt: string };

async function applyOp<T extends BaseEntity>(
  apiFn: () => Promise<T>,
  queryClient: QueryClient,
  key: unknown[],
  entityId: string,
): Promise<void> {
  const result = await apiFn();
  queryClient.setQueryData<T[]>(key, (old) =>
    (old ?? []).map((item) => (item.id === entityId ? result : item))
  );
}

function isGoneStatus(err: unknown): boolean {
  return (
    typeof err === 'object' &&
    err !== null &&
    'status' in err &&
    [401, 403, 404].includes((err as { status: number }).status)
  );
}

async function applyUpdateOp<T extends BaseEntity>(
  fetchFn: () => Promise<T>,
  patchFn: () => Promise<T>,
  queryClient: QueryClient,
  key: unknown[],
  entityId: string,
  opCreatedAt: string,
): Promise<void> {
  let current: T;

  try {
    current = await fetchFn();
  } catch (err) {
    if (isGoneStatus(err)) {
      queryClient.setQueryData<T[]>(key, (old) => (old ?? []).filter((item) => item.id !== entityId));
      return;
    }

    throw err;
  }

  // The data has been updated since the operation was created; skip applying.
  if (current.updatedAt > opCreatedAt) {
    return;
  }

  await applyOp(patchFn, queryClient, key, entityId);
}

async function processOp(
  op: typeof pendingOperations.$inferSelect,
  queryClient: QueryClient,
  txKey: unknown[],
  baKey: unknown[],
  tagsKey: unknown[],
): Promise<void> {
  const payload = JSON.parse(op.payload);

  if (op.entityType === 'transaction') {
    if (op.operation === 'create') {
      await applyOp<ApiTransaction>(
        () => api.post(`/bank-accounts/${payload.bankAccountId}/transactions`, payload.body),
        queryClient, txKey, op.entityId,
      );
    } else if (op.operation === 'update' || op.operation === 'update_tags') {
      await applyUpdateOp<ApiTransaction>(
        () => api.get(`/transactions/${payload.transactionId}`),
        () => api.patch(`/transactions/${payload.transactionId}`, payload.body),
        queryClient, txKey, op.entityId, op.createdAt,
      );
    } else if (op.operation === 'delete') {
      await api.delete(`/transactions/${payload.transactionId}`);
    }
  } else if (op.entityType === 'bank_account') {
    if (op.operation === 'create') {
      await applyOp<ApiBankAccount>(
        () => api.post(`/users/${payload.userId}/bank-accounts`, payload.body),
        queryClient, baKey, op.entityId,
      );
    } else if (op.operation === 'update') {
      await applyUpdateOp<ApiBankAccount>(
        () => api.get(`/bank-accounts/${payload.bankAccountId}`),
        () => api.patch(`/bank-accounts/${payload.bankAccountId}`, payload.body),
        queryClient, baKey, op.entityId, op.createdAt,
      );
    } else if (op.operation === 'delete') {
      await api.delete(`/bank-accounts/${payload.bankAccountId}`);
    }
  } else if (op.entityType === 'tag') {
    if (op.operation === 'create') {
      await applyOp<ApiTag>(
        () => api.post('/tags', payload.body),
        queryClient, tagsKey, op.entityId,
      );
    }
  }
}

export async function flushPendingQueue(
  queryClient: QueryClient,
  userId: string,
): Promise<void> {
  if (!onlineManager.isOnline()) return;

  const ops = await db.select().from(pendingOperations).orderBy(pendingOperations.createdAt);

  const txKey = ['transactions', userId];
  const baKey = ['bank-accounts', userId];
  const tagsKey = ['tags', userId];

  let anyFailed = false;

  for (const op of ops) {
    try {
      await processOp(op, queryClient, txKey, baKey, tagsKey);
    } catch (err) {
      if ((err instanceof TypeError && err.message === 'Network request failed') || !onlineManager.isOnline()) {
        console.warn('[sync] Network unavailable mid-flush; deferring remaining operations.');
        return;
      }

      const { entityId, entityType, operation } = op;
      console.error('[sync] Failed to flush pending operation:', entityType, operation, entityId, err);
      anyFailed = true;

      if (entityType === 'transaction') {
        queryClient.removeQueries({ queryKey: txKey });
      } else if (entityType === 'bank_account') {
        queryClient.removeQueries({ queryKey: baKey });
      } else if (entityType === 'tag') {
        queryClient.removeQueries({ queryKey: tagsKey });
      }
    }

    await db.delete(pendingOperations).where(eq(pendingOperations.id, op.id));
  }

  if (anyFailed) {
    Alert.alert('Sync failed', 'Some offline changes could not be synced and have been discarded.');
  }
}
