export interface AbnAmroTransaction {
  transactionId: string;
  bookDate: string;
  amount: number;
  currencyCode: string;
  description: string;
  counterPartyAccountNumber: string;
  counterPartyName: string;
  transactionType: string;
  mutationCode: string;
}

export interface AbnAmroTransactionsResponse {
  accountNumber: string;
  nextPageKey: string | null;
  transactions: AbnAmroTransaction[];
}
