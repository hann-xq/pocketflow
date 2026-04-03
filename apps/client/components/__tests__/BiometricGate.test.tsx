import { fireEvent, render, screen } from '@testing-library/react-native';
import { BiometricGate } from '../BiometricGate';

const onRetry = jest.fn();

describe('BiometricGate', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the logo and header', () => {
    render(<BiometricGate authFailed={false} onRetry={onRetry} />);
    expect(screen.getByLabelText('PocketFlow logo')).toBeTruthy();
    expect(screen.getByText('Authentication Required')).toBeTruthy();
  });

  it('shows the pending message when auth has not yet failed', () => {
    render(<BiometricGate authFailed={false} onRetry={onRetry} />);
    expect(screen.getByText('Please verify your identity to continue')).toBeTruthy();
    expect(screen.queryByLabelText('Try again')).toBeNull();
  });

  it('shows the error message and retry button when auth failed', () => {
    render(<BiometricGate authFailed={true} onRetry={onRetry} />);
    expect(screen.getByText('Authentication required')).toBeTruthy();
    expect(screen.getByLabelText('Try again')).toBeTruthy();
    expect(screen.queryByText('Please verify your identity to continue')).toBeNull();
  });

  it('calls onRetry when the retry button is pressed', () => {
    render(<BiometricGate authFailed={true} onRetry={onRetry} />);
    fireEvent.press(screen.getByLabelText('Try again'));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});
