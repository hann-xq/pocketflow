import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { useAuth } from '@/lib/auth-context';
import LoginScreen from '../LoginScreen';

jest.mock('@/lib/auth-context', () => ({
  useAuth: jest.fn(),
}));

describe('LoginScreen', () => {
  const mockLogin = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useAuth as jest.Mock).mockReturnValue({
      login: mockLogin,
      token: null,
      userId: null,
      isLoading: false,
      logout: jest.fn(),
    });
  });

  it('renders the email field, password field, and sign-in button', () => {
    render(<LoginScreen onShowRegister={jest.fn()} />);

    expect(screen.getByLabelText('Email')).toBeTruthy();
    expect(screen.getByLabelText('Password')).toBeTruthy();
    expect(screen.getByLabelText('Sign in')).toBeTruthy();
  });

  it('shows a validation error when submitted with empty fields', () => {
    render(<LoginScreen onShowRegister={jest.fn()} />);

    fireEvent.press(screen.getByLabelText('Sign in'));

    expect(screen.getByText('Please enter your email and password.')).toBeTruthy();
  });

  it('calls login with the entered credentials on submit', async () => {
    mockLogin.mockResolvedValueOnce(undefined);
    render(<LoginScreen onShowRegister={jest.fn()} />);

    fireEvent.changeText(screen.getByLabelText('Email'), 'user@example.com');
    fireEvent.changeText(screen.getByLabelText('Password'), 'secret');
    fireEvent.press(screen.getByLabelText('Sign in'));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('user@example.com', 'secret');
    });
  });

  it('shows an error message when login fails', async () => {
    mockLogin.mockRejectedValueOnce(new Error('Invalid credentials.'));
    render(<LoginScreen onShowRegister={jest.fn()} />);

    fireEvent.changeText(screen.getByLabelText('Email'), 'user@example.com');
    fireEvent.changeText(screen.getByLabelText('Password'), 'wrongpassword');
    fireEvent.press(screen.getByLabelText('Sign in'));

    await waitFor(() => {
      expect(screen.getByText('Invalid credentials.')).toBeTruthy();
    });
  });
});
