import { fireEvent, render, screen } from '@testing-library/react-native';
import { router } from 'expo-router';
import { CategoryItem } from '../insights/CategoryItem';

const base = {
  category: { id: 'groceries-1', name: 'Groceries', count: 3, total: 75.5 },
  total: 200,
  activeTab: 'spendings' as const,
};

describe('CategoryItem', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the category name', () => {
    render(<CategoryItem {...base} />);
    expect(screen.getByText('Groceries')).toBeTruthy();
  });

  it('renders the category amount', () => {
    render(<CategoryItem {...base} />);
    expect(screen.getByText('€75.50')).toBeTruthy();
  });

  it('renders the transaction count', () => {
    render(<CategoryItem {...base} />);
    expect(screen.getByText('3 transactions')).toBeTruthy();
  });

  it('uses singular "transaction" when count is 1', () => {
    render(<CategoryItem {...base} category={{ ...base.category, count: 1 }} />);
    expect(screen.getByText('1 transaction')).toBeTruthy();
  });

  it('includes the percentage in the accessibility label', () => {
    // 75.50 / 200 = 37.75 → rounds to 38%
    render(<CategoryItem {...base} />);
    expect(screen.getByLabelText('Groceries, €75.50, 38%')).toBeTruthy();
  });

  it('shows 0% when total is zero', () => {
    render(<CategoryItem {...base} total={0} />);
    expect(screen.getByLabelText('Groceries, €75.50, 0%')).toBeTruthy();
  });

  it('navigates to the category page when pressed', () => {
    render(<CategoryItem {...base} />);
    fireEvent.press(screen.getByLabelText('Groceries, €75.50, 38%'));
    expect(router.push).toHaveBeenCalledWith({
      pathname: '/insights/[category]',
      params: {
        category: 'groceries-1',
        categoryId: 'groceries-1',
        categoryName: 'Groceries',
        type: 'spendings',
      },
    });
  });

  it('passes the active tab as the type param when navigating', () => {
    render(<CategoryItem {...base} activeTab="income" />);
    fireEvent.press(screen.getByLabelText('Groceries, €75.50, 38%'));
    expect(router.push).toHaveBeenCalledWith(
      expect.objectContaining({ params: expect.objectContaining({ type: 'income' }) })
    );
  });

  it('navigates exactly once per press', () => {
    render(<CategoryItem {...base} />);
    fireEvent.press(screen.getByLabelText('Groceries, €75.50, 38%'));
    expect(router.push).toHaveBeenCalledTimes(1);
  });

  it('formats amounts over 1000 with a comma', () => {
    render(<CategoryItem {...base} category={{ ...base.category, total: 1234.56 }} />);
    expect(screen.getByText('€1,234.56')).toBeTruthy();
  });
});
