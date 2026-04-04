import { fireEvent, render, screen } from '@testing-library/react-native';
import { DeleteAccountModal } from '../profile/DeleteAccountModal';

jest.mock('@/components/BottomSheetModal');

const baseProps = {
  visible: true,
  isDeleting: false,
  onClose: jest.fn(),
  onConfirm: jest.fn(),
};

describe('DeleteAccountModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the modal title and warning text when visible', () => {
    render(<DeleteAccountModal {...baseProps} />);
    expect(screen.getAllByText('Delete Account').length).toBeGreaterThan(0);
    expect(screen.getByText(/permanently delete your account/i)).toBeTruthy();
  });

  it('does not render when visible is false', () => {
    render(<DeleteAccountModal {...baseProps} visible={false} />);
    expect(screen.queryByText('Delete Account')).toBeNull();
  });

  it('renders the confirmation input', () => {
    render(<DeleteAccountModal {...baseProps} />);
    expect(screen.getByLabelText('Type Confirm to proceed')).toBeTruthy();
  });

  it('has the delete button disabled when the input is empty', () => {
    render(<DeleteAccountModal {...baseProps} />);
    expect(screen.getByLabelText('Delete account')).toBeDisabled();
  });

  it('has the delete button disabled when the input does not match exactly', () => {
    render(<DeleteAccountModal {...baseProps} />);
    fireEvent.changeText(screen.getByLabelText('Type Confirm to proceed'), 'confirm');
    expect(screen.getByLabelText('Delete account')).toBeDisabled();
  });

  it('enables the delete button when the input is exactly "Confirm"', () => {
    render(<DeleteAccountModal {...baseProps} />);
    fireEvent.changeText(screen.getByLabelText('Type Confirm to proceed'), 'Confirm');
    expect(screen.getByLabelText('Delete account')).not.toBeDisabled();
  });

  it('calls onConfirm when the delete button is pressed with correct input', () => {
    render(<DeleteAccountModal {...baseProps} />);
    fireEvent.changeText(screen.getByLabelText('Type Confirm to proceed'), 'Confirm');
    fireEvent.press(screen.getByLabelText('Delete account'));
    expect(baseProps.onConfirm).toHaveBeenCalled();
  });

  it('clears the input after confirming', () => {
    render(<DeleteAccountModal {...baseProps} />);
    fireEvent.changeText(screen.getByLabelText('Type Confirm to proceed'), 'Confirm');
    fireEvent.press(screen.getByLabelText('Delete account'));
    expect(screen.getByLabelText('Type Confirm to proceed').props.value).toBe('');
  });

  it('calls onClose and clears the input when the close button is pressed', () => {
    render(<DeleteAccountModal {...baseProps} />);
    fireEvent.changeText(screen.getByLabelText('Type Confirm to proceed'), 'Confirm');
    fireEvent.press(screen.getByLabelText('Close'));
    expect(baseProps.onClose).toHaveBeenCalled();
    expect(screen.queryByDisplayValue('Confirm')).toBeNull();
  });

  it('disables the delete button and input when isDeleting is true', () => {
    render(<DeleteAccountModal {...baseProps} isDeleting={true} />);
    fireEvent.changeText(screen.getByLabelText('Type Confirm to proceed'), 'Confirm');
    expect(screen.getByLabelText('Delete account')).toBeDisabled();
    expect(screen.getByLabelText('Type Confirm to proceed').props.editable).toBe(false);
  });

  it('shows "Deleting..." button text when isDeleting is true', () => {
    render(<DeleteAccountModal {...baseProps} isDeleting={true} />);
    expect(screen.getByText('Deleting...')).toBeTruthy();
  });

  it('shows "Delete Account" button text when not deleting', () => {
    render(<DeleteAccountModal {...baseProps} isDeleting={false} />);
    expect(screen.queryByText('Deleting...')).toBeNull();
  });
});
