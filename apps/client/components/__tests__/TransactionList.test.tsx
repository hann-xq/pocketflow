import { render, screen } from '@testing-library/react-native';
import { TransactionList } from '../transaction/TransactionList';
import type { ApiTransaction } from '@/lib/types';


function makeTransaction(overrides: Partial<ApiTransaction> = {}): ApiTransaction {
  return {
    id: 'tx-1',
    bankAccountId: 'ba-1',
    isExternal: false,
    updatedAt: '2024-01-15T00:00:00.000Z',
    description: 'Coffee',
    amount: '-3.50',
    date: '2024-01-15',
    counterpartyName: 'Starbucks',
    counterpartyAccount: null,
    userId: 'user-1',
    category: { id: 'cat-1', name: 'Food & Drink', description: 'Food and drink expenses' },
    categoryId: 'cat-1',
    tags: [],
    ...overrides,
  };
}

describe('TransactionList', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders a transaction item', () => {
    render(<TransactionList transactions={[makeTransaction()]} />);
    expect(screen.getByLabelText('Starbucks, -€3.50')).toBeTruthy();
  });

  it('renders a section header with the formatted date for past dates', () => {
    render(<TransactionList transactions={[makeTransaction()]} />);
    expect(screen.getByLabelText('Transactions for 15/01/2024')).toBeTruthy();
  });

  it('shows "Today" for today\'s date', () => {
    const today = new Date().toISOString().slice(0, 10);
    render(<TransactionList transactions={[makeTransaction({ date: today })]} />);
    expect(screen.getByLabelText('Transactions for Today')).toBeTruthy();
  });

  it('shows "Yesterday" for yesterday\'s date', () => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    const yesterday = d.toISOString().slice(0, 10);
    render(<TransactionList transactions={[makeTransaction({ date: yesterday })]} />);
    expect(screen.getByLabelText('Transactions for Yesterday')).toBeTruthy();
  });

  it('renders nothing when transactions list is empty', () => {
    render(<TransactionList transactions={[]} />);
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('renders multiple items across different dates', () => {
    const transactions = [
      makeTransaction({ id: 'tx-1', date: '2024-01-15', counterpartyName: 'Starbucks', amount: '-3.50' }),
      makeTransaction({ id: 'tx-2', date: '2024-01-16', counterpartyName: 'Salary', amount: '2500.00' }),
    ];
    render(<TransactionList transactions={transactions} />);
    expect(screen.getByLabelText('Starbucks, -€3.50')).toBeTruthy();
    expect(screen.getByLabelText('Salary, +€2500.00')).toBeTruthy();
  });

  it('renders items on the same date under one section header', () => {
    const transactions = [
      makeTransaction({ id: 'tx-1', date: '2024-01-15', counterpartyName: 'Starbucks', amount: '-3.50' }),
      makeTransaction({ id: 'tx-2', date: '2024-01-15', counterpartyName: 'Lunch', amount: '-12.00' }),
    ];
    render(<TransactionList transactions={transactions} />);
    expect(screen.getAllByLabelText('Transactions for 15/01/2024')).toHaveLength(1);
    expect(screen.getByLabelText('Starbucks, -€3.50')).toBeTruthy();
    expect(screen.getByLabelText('Lunch, -€12.00')).toBeTruthy();
  });

  it('orders sections newest date first', () => {
    const transactions = [
      makeTransaction({ id: 'tx-1', date: '2024-01-15', counterpartyName: 'Old', amount: '-1.00' }),
      makeTransaction({ id: 'tx-2', date: '2024-01-20', counterpartyName: 'New', amount: '-2.00' }),
    ];
    render(<TransactionList transactions={transactions} />);
    const headers = screen.getAllByRole('header');
    const headerLabels = headers.map((h) => h.props.accessibilityLabel as string);
    expect(headerLabels.indexOf('Transactions for 20/01/2024')).toBeLessThan(
      headerLabels.indexOf('Transactions for 15/01/2024'),
    );
  });
});
