import { fireEvent, render, screen } from '@testing-library/react-native';
import LoginForm from '../auth/LoginForm';

describe('LoginForm', () => {
  const mockOnSubmit = jest.fn();
  const mockOnNavigateToRegister = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('calls onSubmit with the entered email and password', () => {
    render(
      <LoginForm
        error={null}
        loading={false}
        onSubmit={mockOnSubmit}
        onNavigateToRegister={mockOnNavigateToRegister}
      />,
    );

    fireEvent.changeText(screen.getByLabelText('Email'), 'user@example.com');
    fireEvent.changeText(screen.getByLabelText('Password'), 'secret');
    fireEvent.press(screen.getByLabelText('Sign in'));

    expect(mockOnSubmit).toHaveBeenCalledWith('user@example.com', 'secret');
  });

  it('calls onNavigateToRegister when the sign-up link is pressed', () => {
    render(
      <LoginForm
        error={null}
        loading={false}
        onSubmit={mockOnSubmit}
        onNavigateToRegister={mockOnNavigateToRegister}
      />,
    );

    fireEvent.press(screen.getByLabelText('Create an account'));

    expect(mockOnNavigateToRegister).toHaveBeenCalled();
  });
});
