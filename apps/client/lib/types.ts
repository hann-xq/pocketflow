export type ApiTag = {
  id: string;
  name: string;
  updatedAt: string;
};

export type ApiTransaction = {
  id: string;
  bankAccountId: string;
  updatedAt: string;
  description: string | null;
  amount: string;
  date: string;
  counterpartyName: string | null;
  counterpartyAccount: string | null;
  userId: string;
  category: {
    id: string;
    name: string;
    description: string;
  } | null;
  categoryId: string | null;
  tags: ApiTag[];
};

export type CreateTransactionInput = {
  bankAccountId: string;
  amount: number;
  date: string;
  description: string | null;
  counterpartyName: string | null;
  counterpartyAccount: string | null;
  categoryId: string;
};

export type UpdateTransactionInput = {
  id: string;
  amount?: number;
  counterpartyName?: string | null;
  counterpartyAccount?: string | null;
  categoryId?: string;
};

export type UpdateTransactionTagsInput = {
  transactionId: string;
  tags: ApiTag[];
};

export type ApiCategory = {
  id: string;
  name: string;
  description: string;
};

export enum ExternalConnectionType {
  AbnAmro = "abn-amro",
}

export type ApiBankAccount = {
  id: string;
  accountName: string;
  updatedAt: string;
  accountNumber: string;
  connectionType: ExternalConnectionType | null;
};

export type TransactionForm = {
  amount: string;
  isExpense: boolean;
  date: string;
  description: string;
  counterpartyName: string;
  counterpartyAccount: string;
  categoryId: string;
  bankAccountId: string;
};
