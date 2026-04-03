import { fireEvent, render, screen } from '@testing-library/react-native';
import { EditTransactionModal } from '../transaction/EditTransactionModal';

jest.mock('@/components/BottomSheetModal', () => ({
  BottomSheetModal: ({
    visible,
    title,
    children,
  }: {
    visible: boolean;
    title: string;
    children: React.ReactNode;
  }) => {
    const { View, Text } = jest.requireActual('react-native') as typeof import('react-native');
    return visible ? (
      <View>
        <Text>{title}</Text>
        {children}
      </View>
    ) : null;
  },
}));

const baseProps = {
  visible: true,
  onClose: jest.fn(),
  editAmount: '-12.50',
  editCounterpartyName: 'Starbucks',
  editCounterpartyAccount: 'NL91ABNA0417164300',
  onChangeAmount: jest.fn(),
  onChangeCounterpartyName: jest.fn(),
  onChangeCounterpartyAccount: jest.fn(),
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
    expect(screen.getByLabelText('Counterparty name')).toBeTruthy();
    expect(screen.getByLabelText('Counterparty account')).toBeTruthy();
  });

  it('does not render when visible is false', () => {
    render(<EditTransactionModal {...baseProps} visible={false} />);
    expect(screen.queryByText('Edit transaction')).toBeNull();
  });

  it('displays the current field values', () => {
    render(<EditTransactionModal {...baseProps} />);
    expect(screen.getByDisplayValue('-12.50')).toBeTruthy();
    expect(screen.getByDisplayValue('Starbucks')).toBeTruthy();
    expect(screen.getByDisplayValue('NL91ABNA0417164300')).toBeTruthy();
  });

  it('calls onChangeAmount when the amount field changes', () => {
    render(<EditTransactionModal {...baseProps} />);
    fireEvent.changeText(screen.getByLabelText('Amount'), '-20.00');
    expect(baseProps.onChangeAmount).toHaveBeenCalledWith('-20.00');
  });

  it('calls onChangeCounterpartyName when the name field changes', () => {
    render(<EditTransactionModal {...baseProps} />);
    fireEvent.changeText(screen.getByLabelText('Counterparty name'), 'Costa');
    expect(baseProps.onChangeCounterpartyName).toHaveBeenCalledWith('Costa');
  });

  it('calls onChangeCounterpartyAccount when the account field changes', () => {
    render(<EditTransactionModal {...baseProps} />);
    fireEvent.changeText(screen.getByLabelText('Counterparty account'), 'BE68 5390 0754 7034');
    expect(baseProps.onChangeCounterpartyAccount).toHaveBeenCalledWith('BE68 5390 0754 7034');
  });

  it('calls onSave when the Save button is pressed', () => {
    render(<EditTransactionModal {...baseProps} />);
    fireEvent.press(screen.getByLabelText('Save transaction'));
    expect(baseProps.onSave).toHaveBeenCalledTimes(1);
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
