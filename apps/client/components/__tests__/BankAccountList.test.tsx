import { fireEvent, render, screen } from '@testing-library/react-native';
import { BankAccountList } from '../profile/BankAccountList';
import { ExternalConnectionType, type ApiBankAccount } from '@/lib/types';

const baseProps = {
  bankAccounts: [],
  isLoading: false,
  isOnline: false,
  error: null,
  syncingAccountId: undefined,
  onAdd: jest.fn(),
  onEdit: jest.fn(),
  onDelete: jest.fn(),
  onConnectExternalConnection: jest.fn(),
  onRemoveExternalConnection: jest.fn(),
  onSyncExternalConnection: jest.fn(),
};

const savings: ApiBankAccount = {
  id: '1',
  accountName: 'Savings',
  accountNumber: 'NL91ABNA0417164300',
  updatedAt: '2024-01-01T00:00:00.000Z',
  connectionType: null,
};

const checking: ApiBankAccount = {
  id: '2',
  accountName: 'Checking',
  accountNumber: 'NL69INGB0123456789',
  updatedAt: '2024-01-01T00:00:00.000Z',
  connectionType: null,
};

const connected: ApiBankAccount = {
  id: '3',
  accountName: 'Connected',
  accountNumber: 'NL20RABO0300065264',
  updatedAt: '2024-01-01T00:00:00.000Z',
  connectionType: ExternalConnectionType.AbnAmro,
};

const accounts = [savings, checking, connected];

describe('BankAccountList', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the Bank Accounts header', () => {
    render(<BankAccountList {...baseProps} />);
    expect(screen.getByText('Bank Accounts')).toBeTruthy();
  });

  it('calls onAdd when the add button is pressed', () => {
    render(<BankAccountList {...baseProps} />);
    fireEvent.press(screen.getByLabelText('Add bank account'));
    expect(baseProps.onAdd).toHaveBeenCalled();
  });

  it('renders all bank account items', () => {
    render(<BankAccountList {...baseProps} bankAccounts={accounts} />);
    expect(screen.getByLabelText('Savings, NL91ABNA0417164300')).toBeTruthy();
    expect(screen.getByLabelText('Checking, NL69INGB0123456789')).toBeTruthy();
    expect(screen.getByLabelText('Connected, NL20RABO0300065264')).toBeTruthy();
  });

  it('shows the empty state when there are no accounts', () => {
    render(<BankAccountList {...baseProps} />);
    expect(screen.getByText('No bank accounts found')).toBeTruthy();
  });

  it('does not show the empty state while loading', () => {
    render(<BankAccountList {...baseProps} isLoading={true} />);
    expect(screen.queryByText('No bank accounts found')).toBeNull();
  });

  it('shows the loading indicator while loading', () => {
    render(<BankAccountList {...baseProps} isLoading={true} />);
    expect(screen.getByLabelText('Loading bank accounts')).toBeTruthy();
  });

  it('does not show the empty state when there is an error', () => {
    render(<BankAccountList {...baseProps} error={new Error('Network error')} />);
    expect(screen.queryByText('No bank accounts found')).toBeNull();
  });

  it('shows the error message when an error occurs', () => {
    render(<BankAccountList {...baseProps} error={new Error('Network error')} />);
    expect(screen.getByText('Network error')).toBeTruthy();
  });

  it('calls onEdit with the correct account when edit is pressed', () => {
    render(<BankAccountList {...baseProps} bankAccounts={accounts} />);
    fireEvent.press(screen.getByLabelText('Edit Checking'));
    expect(baseProps.onEdit).toHaveBeenCalledTimes(1);
    expect(baseProps.onEdit).toHaveBeenCalledWith(checking);
  });

  it('calls onDelete with the correct account when delete is pressed', () => {
    render(<BankAccountList {...baseProps} bankAccounts={accounts} />);
    fireEvent.press(screen.getByLabelText('Delete Savings'));
    expect(baseProps.onDelete).toHaveBeenCalledTimes(1);
    expect(baseProps.onDelete).toHaveBeenCalledWith(savings);
  });

  it('does not call onEdit for other accounts when one is edited', () => {
    render(<BankAccountList {...baseProps} bankAccounts={accounts} />);
    fireEvent.press(screen.getByLabelText('Edit Savings'));
    expect(baseProps.onEdit).not.toHaveBeenCalledWith(checking);
    expect(baseProps.onEdit).not.toHaveBeenCalledWith(connected);
  });

  it('does not call onDelete for other accounts when one is deleted', () => {
    render(<BankAccountList {...baseProps} bankAccounts={accounts} />);
    fireEvent.press(screen.getByLabelText('Delete Checking'));
    expect(baseProps.onDelete).not.toHaveBeenCalledWith(savings);
    expect(baseProps.onDelete).not.toHaveBeenCalledWith(connected);
  });

  it('disables the sync button only for the account that is syncing', () => {
    render(
      <BankAccountList
        {...baseProps}
        bankAccounts={accounts}
        syncingAccountId={connected.id}
      />,
    );
    expect(screen.getByLabelText('Sync transactions for Connected')).toBeDisabled();
  });
});
