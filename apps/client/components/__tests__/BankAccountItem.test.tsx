import { fireEvent, render, screen } from '@testing-library/react-native';
import { BankAccountItem } from '../BankAccountItem';
import { ExternalConnectionType, type ApiBankAccount } from '@/lib/types';

const baseProps = {
  isOnline: false,
  isSyncing: false,
  onEdit: jest.fn(),
  onDelete: jest.fn(),
  onConnectExternalConnection: jest.fn(),
  onRemoveExternalConnection: jest.fn(),
  onSyncExternalConnection: jest.fn(),
};

const unconnected: ApiBankAccount = {
  id: '1',
  accountName: 'Savings',
  accountNumber: 'NL91ABNA0417164300',
  updatedAt: '2024-01-01T00:00:00.000Z',
  connectionType: null,
};

const connected: ApiBankAccount = {
  id: '2',
  accountName: 'Connected',
  accountNumber: 'NL20RABO0300065264',
  updatedAt: '2024-01-01T00:00:00.000Z',
  connectionType: ExternalConnectionType.AbnAmro,
};

describe('BankAccountItem', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the account name and number', () => {
    render(<BankAccountItem {...baseProps} item={unconnected} />);
    expect(screen.getByText('Savings')).toBeTruthy();
    expect(screen.getByText('NL91ABNA0417164300')).toBeTruthy();
  });

  it('calls onEdit with the item when the edit button is pressed', () => {
    render(<BankAccountItem {...baseProps} item={unconnected} />);
    fireEvent.press(screen.getByLabelText('Edit Savings'));
    expect(baseProps.onEdit).toHaveBeenCalledTimes(1);
    expect(baseProps.onEdit).toHaveBeenCalledWith(unconnected);
  });

  it('calls onDelete with the item when the delete button is pressed', () => {
    render(<BankAccountItem {...baseProps} item={unconnected} />);
    fireEvent.press(screen.getByLabelText('Delete Savings'));
    expect(baseProps.onDelete).toHaveBeenCalledTimes(1);
    expect(baseProps.onDelete).toHaveBeenCalledWith(unconnected);
  });

  it('shows the Connect ABN AMRO button for an unconnected account', () => {
    render(<BankAccountItem {...baseProps} item={unconnected} />);
    expect(screen.getByLabelText('Connect Savings with ABN AMRO')).toBeTruthy();
    expect(screen.queryByLabelText('Remove ABN AMRO connection for Savings')).toBeNull();
    expect(screen.queryByLabelText('Sync transactions for Savings')).toBeNull();
  });

  it('shows Remove Connection and Sync buttons for a connected account', () => {
    render(<BankAccountItem {...baseProps} item={connected} />);
    expect(screen.getByLabelText('Remove ABN AMRO connection for Connected')).toBeTruthy();
    expect(screen.getByLabelText('Sync transactions for Connected')).toBeTruthy();
    expect(screen.queryByLabelText('Connect Connected with ABN AMRO')).toBeNull();
  });

  it('disables action buttons when offline', () => {
    render(<BankAccountItem {...baseProps} isOnline={false} item={connected} />);
    expect(screen.getByLabelText('Remove ABN AMRO connection for Connected')).toBeDisabled();
    expect(screen.getByLabelText('Sync transactions for Connected')).toBeDisabled();
  });

  it('disables the sync button when syncing', () => {
    render(<BankAccountItem {...baseProps} item={connected} isSyncing={true} />);
    expect(screen.getByLabelText('Sync transactions for Connected')).toBeDisabled();
  });

  it('does not call onEdit for a different account', () => {
    render(<BankAccountItem {...baseProps} item={unconnected} />);
    fireEvent.press(screen.getByLabelText('Edit Savings'));
    expect(baseProps.onEdit).not.toHaveBeenCalledWith(connected);
  });
});
