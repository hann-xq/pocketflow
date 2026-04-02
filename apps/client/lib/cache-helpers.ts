import type { QueryClient } from '@tanstack/react-query';
import type { ApiCategory, ApiTransaction, CreateTransactionInput } from '@/lib/types';

export function buildOptimisticTransaction(
  input: CreateTransactionInput,
  tempId: string,
  userId: string,
  queryClient: QueryClient,
): ApiTransaction {
  const categories = queryClient.getQueryData<ApiCategory[]>(['categories']) ?? [];
  const category = categories.find((c) => c.id === input.categoryId) ?? null;

  return {
    id: tempId,
    bankAccountId: input.bankAccountId,
    updatedAt: new Date().toISOString(),
    amount: String(input.amount),
    date: input.date,
    description: input.description,
    counterpartyName: input.counterpartyName,
    counterpartyAccount: input.counterpartyAccount,
    userId,
    category,
    categoryId: input.categoryId,
    tags: [],
  };
}
