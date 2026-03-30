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
  tags: string[];
};

export type ApiCategory = {
  id: string;
  name: string;
  description: string;
};

export type ApiBankAccount = {
  id: string;
  accountName: string;
  accountNumber: string;
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
