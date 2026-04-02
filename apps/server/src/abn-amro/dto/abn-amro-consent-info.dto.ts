export interface AbnAmroConsentInfoResponse {
  iban: string;
  transactionId: string | null;
  scopes: string;
  valid: string;
  consentStatus?:
    | 'FULLY_SIGNED'
    | 'PARTIALLY_SIGNED'
    | 'INITIAL'
    | 'USER_CANCELLED'
    | 'SYSTEM_CANCELLED';
  consentExpiresIn?: string;
}
