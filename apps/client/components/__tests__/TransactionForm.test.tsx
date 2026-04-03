import { fireEvent, render, screen } from '@testing-library/react-native';
import { TransactionForm } from '../transaction/TransactionForm';
import type { ApiBankAccount, ApiCategory, TransactionForm as TransactionFormValues } from '@/lib/types';
import { ExternalConnectionType } from '@/lib/types';

jest.mock('@react-native-community/datetimepicker', () => {
  const { View } = jest.requireActual('react-native') as typeof import('react-native');
  function MockDateTimePicker() {
    return <View testID="date-time-picker" />;
  }
  return MockDateTimePicker;
});

jest.mock('@/components/transaction/CategoryPickerModal', () => ({
  CategoryPickerModal: () => null,
}));

const baseForm: TransactionFormValues = {
  amount: '12.50',
  isExpense: true,
  date: '2024-03-15',
  description: '',
  counterpartyName: '',
  counterpartyAccount: '',
  categoryId: 'cat-1',
  bankAccountId: 'ba-1',
};

const categories: ApiCategory[] = [
  { id: 'cat-1', name: 'Food', slug: 'food', description: '', type: 'expense' },
  { id: 'cat-2', name: 'Salary', slug: 'salary', description: '', type: 'income' },
];

const bankAccounts: ApiBankAccount[] = [
  { id: 'ba-1', accountName: 'Checking', accountNumber: 'NL01TEST0123456789', connectionType: null, updatedAt: '2024-01-01T00:00:00.000Z' },
  { id: 'ba-2', accountName: 'Savings', accountNumber: 'NL02TEST0987654321', connectionType: ExternalConnectionType.AbnAmro, updatedAt: '2024-01-01T00:00:00.000Z' },
];

const baseProps = {
  form: baseForm,
  setForm: jest.fn(),
  errors: {} as Partial<Record<keyof TransactionFormValues, string>>,
  categories,
  bankAccounts,
  onSubmit: jest.fn(),
  isPending: false,
  isLoading: false,
  isError: false,
  errorMessage: undefined,
};

describe('TransactionForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the amount field with the current value', () => {
    render(<TransactionForm {...baseProps} />);
    expect(screen.getByDisplayValue('12.50')).toBeTruthy();
  });

  it('renders the date', () => {
    render(<TransactionForm {...baseProps} />);
    expect(screen.getByText('2024-03-15')).toBeTruthy();
  });

  it('renders the selected category name', () => {
    render(<TransactionForm {...baseProps} />);
    expect(screen.getByText('Food')).toBeTruthy();
  });

  it('shows placeholder text when no category is selected', () => {
    render(<TransactionForm {...baseProps} form={{ ...baseForm, categoryId: '' }} />);
    expect(screen.getByText('Select a category')).toBeTruthy();
  });

  it('renders the selected bank account', () => {
    render(<TransactionForm {...baseProps} />);
    expect(screen.getByText('Checking (NL01TEST0123456789)')).toBeTruthy();
  });

  it('shows placeholder text when no bank account is selected', () => {
    render(<TransactionForm {...baseProps} form={{ ...baseForm, bankAccountId: '' }} />);
    expect(screen.getByText('Select a bank account')).toBeTruthy();
  });

  it('calls setForm when the amount changes', () => {
    render(<TransactionForm {...baseProps} />);
    fireEvent.changeText(screen.getByLabelText('Amount'), '99.99');
    expect(baseProps.setForm).toHaveBeenCalledTimes(1);
  });

  it('calls setForm when the description changes', () => {
    render(<TransactionForm {...baseProps} />);
    fireEvent.changeText(screen.getByLabelText('Description'), 'Coffee');
    expect(baseProps.setForm).toHaveBeenCalledTimes(1);
  });

  it('calls setForm when counterparty name changes', () => {
    render(<TransactionForm {...baseProps} />);
    fireEvent.changeText(screen.getByLabelText('Counterparty name'), 'Starbucks');
    expect(baseProps.setForm).toHaveBeenCalledTimes(1);
  });

  it('calls setForm when counterparty account changes', () => {
    render(<TransactionForm {...baseProps} />);
    fireEvent.changeText(screen.getByLabelText('Counterparty account'), 'NL91ABNA0417164300');
    expect(baseProps.setForm).toHaveBeenCalledTimes(1);
  });

  it('calls setForm when expense toggle is flipped', () => {
    render(<TransactionForm {...baseProps} />);
    fireEvent(screen.getByLabelText('Expense toggle'), 'valueChange', false);
    expect(baseProps.setForm).toHaveBeenCalledTimes(1);
  });

  it('shows the bank account list when the bank account picker is pressed', () => {
    render(<TransactionForm {...baseProps} />);
    fireEvent.press(screen.getByLabelText('Select bank account'));
    expect(screen.getByLabelText('Checking NL01TEST0123456789')).toBeTruthy();
    expect(screen.getByLabelText('Savings NL02TEST0987654321')).toBeTruthy();
  });

  it('calls setForm and closes picker when a bank account is selected', () => {
    render(<TransactionForm {...baseProps} />);
    fireEvent.press(screen.getByLabelText('Select bank account'));
    fireEvent.press(screen.getByLabelText('Savings NL02TEST0987654321'));
    expect(baseProps.setForm).toHaveBeenCalledTimes(1);
    expect(screen.queryByLabelText('Savings NL02TEST0987654321')).toBeNull();
  });

  it('calls onSubmit when the save button is pressed', () => {
    render(<TransactionForm {...baseProps} />);
    fireEvent.press(screen.getByLabelText('Save transaction'));
    expect(baseProps.onSubmit).toHaveBeenCalledTimes(1);
  });

  it('disables the save button when isPending', () => {
    render(<TransactionForm {...baseProps} isPending={true} />);
    expect(screen.getByLabelText('Save transaction')).toBeDisabled();
  });

  it('disables the save button when isLoading', () => {
    render(<TransactionForm {...baseProps} isLoading={true} />);
    expect(screen.getByLabelText('Save transaction')).toBeDisabled();
  });

  it('hides the Save Transaction text and shows a spinner when isPending', () => {
    render(<TransactionForm {...baseProps} isPending={true} />);
    expect(screen.queryByText('Save Transaction')).toBeNull();
  });

  it('shows the Save Transaction text when not pending', () => {
    render(<TransactionForm {...baseProps} />);
    expect(screen.getByText('Save Transaction')).toBeTruthy();
  });

  it('shows the error banner when isError is true', () => {
    render(<TransactionForm {...baseProps} isError={true} errorMessage="Something went wrong" />);
    expect(screen.getByText('Something went wrong')).toBeTruthy();
  });

  it('shows a fallback error message when errorMessage is absent', () => {
    render(<TransactionForm {...baseProps} isError={true} />);
    expect(screen.getByText('Failed to create transaction')).toBeTruthy();
  });

  it('does not show the error banner when isError is false', () => {
    render(<TransactionForm {...baseProps} isError={false} />);
    expect(screen.queryByText('Failed to create transaction')).toBeNull();
  });

  it('shows amount error message', () => {
    render(<TransactionForm {...baseProps} errors={{ amount: 'Enter a valid amount' }} />);
    expect(screen.getByText('Enter a valid amount')).toBeTruthy();
  });

  it('shows date error message', () => {
    render(<TransactionForm {...baseProps} errors={{ date: 'Use format YYYY-MM-DD' }} />);
    expect(screen.getByText('Use format YYYY-MM-DD')).toBeTruthy();
  });

  it('shows category error message', () => {
    render(<TransactionForm {...baseProps} errors={{ categoryId: 'Select a category' }} />);
    expect(screen.getByText('Select a category')).toBeTruthy();
  });

  it('shows bank account error message', () => {
    render(<TransactionForm {...baseProps} errors={{ bankAccountId: 'No bank account found' }} />);
    expect(screen.getByText('No bank account found')).toBeTruthy();
  });

  it('opens the date picker when the date row is pressed', () => {
    render(<TransactionForm {...baseProps} />);
    expect(screen.queryByTestId('date-time-picker')).toBeNull();
    fireEvent.press(screen.getByLabelText('Select date'));
    expect(screen.getByTestId('date-time-picker')).toBeTruthy();
  });
});
