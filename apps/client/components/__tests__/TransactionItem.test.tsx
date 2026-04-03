import { fireEvent, render, screen } from '@testing-library/react-native';
import { router } from 'expo-router';
import { TransactionItem } from '../transaction/TransactionItem';
import type { ApiTransaction } from '@/lib/types';


const base: ApiTransaction = {
  id: 'tx-1',
  bankAccountId: 'ba-1',
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
};

describe('TransactionItem', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the counterparty name and amount', () => {
    render(<TransactionItem item={base} />);
    expect(screen.getByText('Starbucks')).toBeTruthy();
    expect(screen.getByText('-€3.50')).toBeTruthy();
  });

  it('shows "Unknown" when counterpartyName is absent', () => {
    render(<TransactionItem item={{ ...base, counterpartyName: null }} />);
    expect(screen.getByText('Unknown')).toBeTruthy();
  });

  it('shows a + prefix for income', () => {
    render(<TransactionItem item={{ ...base, amount: '2500.00' }} />);
    expect(screen.getByText('+€2500.00')).toBeTruthy();
  });

  it('shows the category name when present', () => {
    render(<TransactionItem item={{ ...base, category: { id: 'c-1', name: 'Food', description: '' } }} />);
    expect(screen.getByText('Food')).toBeTruthy();
  });

  it('navigates to transaction details when pressed', () => {
    render(<TransactionItem item={base} />);
    fireEvent.press(screen.getByLabelText('Starbucks, -€3.50'));
    expect(router.push).toHaveBeenCalledWith({
      pathname: '/transactions/[id]',
      params: { id: 'tx-1', data: JSON.stringify(base) },
    });
  });

  it('renders without a swipe wrapper when onDelete is not provided', () => {
    render(<TransactionItem item={base} />);
    expect(screen.getByLabelText('Starbucks, -€3.50')).toBeTruthy();
  });

  it('renders with a swipe wrapper when onDelete is provided', () => {
    render(<TransactionItem item={base} onDelete={jest.fn()} />);
    expect(screen.getByLabelText('Starbucks, -€3.50')).toBeTruthy();
  });
});
