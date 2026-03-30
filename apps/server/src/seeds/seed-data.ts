export const SEED_USER = {
  email: 'test@example.com',
  password: 'password123',
  firstName: 'Test',
  lastName: 'User',
} as const;

export const SEED_BANK_ACCOUNT = {
  accountNumber: 'NL58ABNA9999142181',
  accountName: 'Checking',
} as const;

export const SEED_CATEGORIES = [
  { name: 'Groceries', description: 'Food and grocery shopping' },
  { name: 'Transport', description: 'Public transport, fuel, and parking' },
  { name: 'Housing', description: 'Rent, mortgage, and utilities' },
  { name: 'Entertainment', description: 'Leisure and subscriptions' },
] as const;

export const SEED_TAGS = [
  { name: 'recurring' },
  { name: 'business' },
  { name: 'personal' },
  { name: 'refund' },
] as const;
