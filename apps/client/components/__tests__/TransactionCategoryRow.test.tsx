import { fireEvent, render, screen } from '@testing-library/react-native';
import { TransactionCategoryRow } from '../transaction/detail/TransactionCategoryRow';

describe('TransactionCategoryRow', () => {
  const onPress = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the category name', () => {
    render(<TransactionCategoryRow categoryName="Food" onPress={onPress} />);
    expect(screen.getByText('Food')).toBeTruthy();
  });

  it('shows "Uncategorized" when categoryName is null', () => {
    render(<TransactionCategoryRow categoryName={null} onPress={onPress} />);
    expect(screen.getByText('Uncategorized')).toBeTruthy();
  });

  it('shows "Uncategorized" when categoryName is undefined', () => {
    render(<TransactionCategoryRow categoryName={undefined} onPress={onPress} />);
    expect(screen.getByText('Uncategorized')).toBeTruthy();
  });

  it('calls onPress when tapped', () => {
    render(<TransactionCategoryRow categoryName="Food" onPress={onPress} />);
    fireEvent.press(screen.getByLabelText('Category: Food. Tap to edit.'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('accessibility label reflects "Uncategorized" when no category', () => {
    render(<TransactionCategoryRow categoryName={null} onPress={onPress} />);
    expect(screen.getByLabelText('Category: Uncategorized. Tap to edit.')).toBeTruthy();
  });
});
