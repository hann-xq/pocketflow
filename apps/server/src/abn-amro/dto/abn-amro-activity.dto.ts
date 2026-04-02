export interface AbnAmroActivity {
  id: string;
  mutationCode: string;
  descriptionLines: string[];
  timestamp: string;
  bookDate: string;
  amount: number;
  creditDebitIndicator: 'CRDT' | 'DBIT';
  currency: string;
  balanceAfterMutation: number;
  balanceCreditDebitIndicator: string;
  counterPartyAccountNumber: string;
  counterPartyName: string;
  status: 'EXECUTED' | 'ACTIVE' | 'CANCELLED' | 'BOOKED';
}

export interface AbnAmroActivitiesResponse {
  accountNumber: string;
  nextPageKey: string | null;
  activities: {
    booked: AbnAmroActivity[];
    reservations: AbnAmroActivity[];
  };
}
