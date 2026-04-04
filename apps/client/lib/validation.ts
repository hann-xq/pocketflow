const IBAN_REGEX = /^[A-Z]{2}\d{2}[A-Z]{4}\d{10}$/;
const TAG_NAME_REGEX = /^[a-zA-Z0-9._-]+$/;

function validateCounterpartyName(name: string | null): string | null {
  if (name && (name.length < 2 || name.length > 50)) {
    return 'Counterparty name must be between 2 and 50 characters.';
  }

  return null;
}

function validateCounterpartyAccount(account: string | null): string | null {
  if (!account) {
    return null;
  }

  if (!IBAN_REGEX.test(account.replace(/\s/g, ''))) {
    return 'Counterparty account must be a valid IBAN.';
  }

  return null;
}

export function validateTransaction(input: {
  amount: number;
  date: string;
  description: string | null;
  counterpartyName: string | null;
  counterpartyAccount: string | null;
  categoryId: string;
}): string | null {
  if (isNaN(input.amount)) {
    return 'Amount must be a valid number.';
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.date)) {
    return 'Date must be in YYYY-MM-DD format.';
  }

  if (input.description !== null && input.description.length > 500) {
    return 'Description must not exceed 500 characters.';
  }

  const nameError = validateCounterpartyName(input.counterpartyName);
  if (nameError) {
    return nameError;
  }

  const accountError = validateCounterpartyAccount(input.counterpartyAccount);
  if (accountError) {
    return accountError;
  }

  if (!input.categoryId) {
    return 'Category is required.';
  }

  return null;
}

export function validateBankAccount(input: { accountName: string; accountNumber: string }): string | null {
  if (input.accountName.length < 2 || input.accountName.length > 60) {
    return 'Account name must be between 2 and 60 characters.';
  }

  const iban = input.accountNumber.replace(/\s/g, '');
  if (!IBAN_REGEX.test(iban)) {
    return 'Account number must be a valid IBAN.';
  }

  return null;
}

export function validateIban(value: string): string | null {
  const iban = value.replace(/\s/g, '');

  if (!iban) {
    return 'Account number is required.';
  }

  if (!/^[A-Z]{2}/.test(iban)) {
    return 'IBAN must start with a 2-letter country code (e.g. NL).';
  }

  if (!/^[A-Z]{2}\d{2}/.test(iban)) {
    return 'Country code must be followed by 2 check digits.';
  }

  if (!IBAN_REGEX.test(iban)) {
    return 'Invalid IBAN format. Expected: 2-letter country code, 2 check digits, 4-letter bank code, 10-digit account number.';
  }

  return null;
}

export function validateTransactionEdit(input: {
  amount: string;
  counterpartyName: string;
  counterpartyAccount: string;
}): Partial<Record<'amount' | 'counterpartyName' | 'counterpartyAccount', string>> {
  const errors: Partial<Record<'amount' | 'counterpartyName' | 'counterpartyAccount', string>> = {};

  const parsed = parseFloat(input.amount);
  if (!input.amount || isNaN(parsed) || parsed < 0) {
    errors.amount = 'Amount must be a valid number and at least 0.';
  }

  const nameError = validateCounterpartyName(input.counterpartyName || null);
  if (nameError) {
    errors.counterpartyName = nameError;
  }

  const accountError = validateCounterpartyAccount(input.counterpartyAccount || null);
  if (accountError) {
    errors.counterpartyAccount = accountError;
  }

  return errors;
}

export function validateTagName(name: string): string | null {
  if (name.length < 1 || name.length > 50) {
    return 'Tag name must be between 1 and 50 characters.';
  }

  if (!TAG_NAME_REGEX.test(name)) {
    return 'Tag name can only contain letters, numbers, dots, underscores, and hyphens.';
  }

  return null;
}
