export interface AbnAmroTransaction {
  transactionId: string;
  bookDate: string;
  amount: number;
  currencyCode: string;
  descriptionLines: string[];
  counterPartyAccountNumber: string;
  counterPartyName: string;
  transactionType: string;
  mutationCode: string;
  balanceAfterMutation: number;
}

export interface AbnAmroTransactionsResponse {
  accountNumber: string;
  nextPageKey: string | null;
  transactions: AbnAmroTransaction[];
}
