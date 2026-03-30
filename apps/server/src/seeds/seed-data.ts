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
  { name: 'Uncategorized', slug: 'uncategorized', description: null },
  {
    name: 'Groceries',
    slug: 'groceries',
    description: 'Food and grocery shopping',
  },
  {
    name: 'Transport',
    slug: 'transport',
    description: 'Public transport, fuel, and parking',
  },
  {
    name: 'Housing',
    slug: 'housing',
    description: 'Rent, mortgage, and utilities',
  },
  {
    name: 'Entertainment',
    slug: 'entertainment',
    description: 'Leisure and subscriptions',
  },
] as const;

export const SEED_TAGS = [
  { name: 'recurring' },
  { name: 'business' },
  { name: 'personal' },
  { name: 'refund' },
] as const;
