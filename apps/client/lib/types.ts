export type ApiTag = {
  id: string;
  name: string;
};

export type ApiTransaction = {
  id: string;
  description: string | null;
  amount: string;
  date: string;
  counterpartyName: string;
  counterpartyAccount: string;
  userId: string;
  category: {
    id: string;
    name: string;
    description: string;
  } | null;
  categoryId: string | null;
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
