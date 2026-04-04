import { fireEvent, render, screen } from '@testing-library/react-native';
import { EditTransactionModal } from '../transaction/EditTransactionModal';

jest.mock('@/components/BottomSheetModal');

const baseValues = {
  amount: '12.50',
  description: 'Morning coffee',
  counterpartyName: 'Starbucks',
  counterpartyAccount: 'NL91ABNA0417164300',
};

const baseProps = {
  visible: true,
  onClose: jest.fn(),
  initialValues: baseValues,
  isExternal: false,
  onSave: jest.fn(),
  isPending: false,
};

describe('EditTransactionModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the modal title and fields when visible', () => {
    render(<EditTransactionModal {...baseProps} />);
    expect(screen.getByText('Edit transaction')).toBeTruthy();
    expect(screen.getByLabelText('Amount')).toBeTruthy();
    expect(screen.getByLabelText('Description')).toBeTruthy();
    expect(screen.getByLabelText('Counterparty name')).toBeTruthy();
    expect(screen.getByLabelText('Counterparty account')).toBeTruthy();
  });

  it('hides the description field for external transactions', () => {
    render(<EditTransactionModal {...baseProps} isExternal={true} />);
    expect(screen.queryByLabelText('Description')).toBeNull();
    expect(screen.getByLabelText('Amount')).toBeTruthy();
    expect(screen.getByLabelText('Counterparty name')).toBeTruthy();
    expect(screen.getByLabelText('Counterparty account')).toBeTruthy();
  });

  it('does not render when visible is false', () => {
    render(<EditTransactionModal {...baseProps} visible={false} />);
    expect(screen.queryByText('Edit transaction')).toBeNull();
  });

  it('displays the initial field values', () => {
    render(<EditTransactionModal {...baseProps} />);
    expect(screen.getByDisplayValue('12.50')).toBeTruthy();
    expect(screen.getByDisplayValue('Morning coffee')).toBeTruthy();
    expect(screen.getByDisplayValue('Starbucks')).toBeTruthy();
    expect(screen.getByDisplayValue('NL91ABNA0417164300')).toBeTruthy();
  });

  it('calls onSave with the current values when the form is valid and Save is pressed', () => {
    render(<EditTransactionModal {...baseProps} />);
    fireEvent.press(screen.getByLabelText('Save transaction'));
    expect(baseProps.onSave).toHaveBeenCalledWith(baseValues);
  });

  it('calls onSave with updated values after fields are changed', () => {
    render(<EditTransactionModal {...baseProps} />);
    fireEvent.changeText(screen.getByLabelText('Amount'), '20.00');
    fireEvent.changeText(screen.getByLabelText('Description'), 'Lunch');
    fireEvent.press(screen.getByLabelText('Save transaction'));
    expect(baseProps.onSave).toHaveBeenCalledWith({
      amount: '20.00',
      description: 'Lunch',
      counterpartyName: 'Starbucks',
      counterpartyAccount: 'NL91ABNA0417164300',
    });
  });

  it('does not call onSave and shows an error when amount is negative', () => {
    render(<EditTransactionModal {...baseProps} initialValues={{ ...baseValues, amount: '-5' }} />);
    fireEvent.press(screen.getByLabelText('Save transaction'));
    expect(baseProps.onSave).not.toHaveBeenCalled();
    expect(screen.getByText('Amount must be a valid number and at least 0.')).toBeTruthy();
  });

  it('does not call onSave and shows an error when amount is not a number', () => {
    render(<EditTransactionModal {...baseProps} initialValues={{ ...baseValues, amount: 'abc' }} />);
    fireEvent.press(screen.getByLabelText('Save transaction'));
    expect(baseProps.onSave).not.toHaveBeenCalled();
    expect(screen.getByText('Amount must be a valid number and at least 0.')).toBeTruthy();
  });

  it('does not call onSave and shows an error when description exceeds 500 characters', () => {
    render(<EditTransactionModal {...baseProps} initialValues={{ ...baseValues, description: 'a'.repeat(501) }} />);
    fireEvent.press(screen.getByLabelText('Save transaction'));
    expect(baseProps.onSave).not.toHaveBeenCalled();
    expect(screen.getByText('Description must not exceed 500 characters.')).toBeTruthy();
  });

  it('does not call onSave and shows an error when counterparty name is too short', () => {
    render(<EditTransactionModal {...baseProps} initialValues={{ ...baseValues, counterpartyName: 'X' }} />);
    fireEvent.press(screen.getByLabelText('Save transaction'));
    expect(baseProps.onSave).not.toHaveBeenCalled();
    expect(screen.getByText('Counterparty name must be between 2 and 50 characters.')).toBeTruthy();
  });

  it('does not call onSave and shows an error when counterparty account is an invalid IBAN', () => {
    render(<EditTransactionModal {...baseProps} initialValues={{ ...baseValues, counterpartyAccount: 'NOTANIBAN' }} />);
    fireEvent.press(screen.getByLabelText('Save transaction'));
    expect(baseProps.onSave).not.toHaveBeenCalled();
    expect(screen.getByText('Counterparty account must be a valid IBAN.')).toBeTruthy();
  });

  it('disables the Save button and shows a spinner when isPending', () => {
    render(<EditTransactionModal {...baseProps} isPending={true} />);
    expect(screen.getByLabelText('Save transaction')).toBeDisabled();
    expect(screen.queryByText('Save')).toBeNull();
  });

  it('shows the Save text when not pending', () => {
    render(<EditTransactionModal {...baseProps} isPending={false} />);
    expect(screen.getByText('Save')).toBeTruthy();
  });
});
