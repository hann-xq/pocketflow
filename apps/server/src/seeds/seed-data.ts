import { CategoryType } from '../categories/enums/category-type.enum';

export const SEED_USER = {
  email: 'test@example.com',
  password: 'password123',
  firstName: 'Test',
  lastName: 'User',
} as const;

export const SEED_ADMIN = {
  email: 'admin@example.com',
  password: 'password123',
  firstName: 'Admin',
  lastName: 'User',
} as const;

export const SEED_BANK_ACCOUNT = {
  accountNumber: 'NL58ABNA9999142181',
  accountName: 'Checking',
} as const;

export const SEED_CATEGORIES = [
  // Expense categories
  {
    name: 'Uncategorized',
    slug: 'uncategorized',
    description: null,
    type: CategoryType.EXPENSE,
  },
  {
    name: 'Groceries',
    slug: 'groceries',
    description: 'Food and grocery shopping',
    type: CategoryType.EXPENSE,
  },
  {
    name: 'Transport',
    slug: 'transport',
    description: 'Public transport, fuel, and parking',
    type: CategoryType.EXPENSE,
  },
  {
    name: 'Housing',
    slug: 'housing',
    description: 'Rent, mortgage, and utilities',
    type: CategoryType.EXPENSE,
  },
  {
    name: 'Entertainment',
    slug: 'entertainment',
    description: 'Leisure and subscriptions',
    type: CategoryType.EXPENSE,
  },
  {
    name: 'Dining',
    slug: 'dining',
    description: 'Restaurants and takeaway',
    type: CategoryType.EXPENSE,
  },
  {
    name: 'Health',
    slug: 'health',
    description: 'Medical expenses and pharmacy',
    type: CategoryType.EXPENSE,
  },

  // Income categories
  {
    name: 'Uncategorized',
    slug: 'uncategorized',
    description: null,
    type: CategoryType.INCOME,
  },
  {
    name: 'Salary',
    slug: 'salary',
    description: 'Employment income',
    type: CategoryType.INCOME,
  },
  {
    name: 'Investments',
    slug: 'investments',
    description: 'Dividends, interest, and capital gains',
    type: CategoryType.INCOME,
  },
  {
    name: 'Freelance',
    slug: 'freelance',
    description: 'Self-employment and contract work',
    type: CategoryType.INCOME,
  },
] as const;

export const SEED_TAGS = [
  { name: 'recurring' },
  { name: 'business' },
  { name: 'personal' },
  { name: 'refund' },
] as const;
