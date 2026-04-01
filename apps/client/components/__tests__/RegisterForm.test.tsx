import { fireEvent, render, screen } from '@testing-library/react-native';
import RegisterForm from '../auth/RegisterForm';

describe('RegisterForm', () => {
  const mockOnSubmit = jest.fn();
  const mockOnNavigateToLogin = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('calls onSubmit with all entered field values', () => {
    render(
      <RegisterForm
        error={null}
        loading={false}
        onSubmit={mockOnSubmit}
        onNavigateToLogin={mockOnNavigateToLogin}
      />,
    );

    fireEvent.changeText(screen.getByLabelText('First name'), 'Jane');
    fireEvent.changeText(screen.getByLabelText('Last name'), 'Doe');
    fireEvent.changeText(screen.getByLabelText('Email'), 'jane@example.com');
    fireEvent.changeText(screen.getByLabelText('Password'), 'password123');
    fireEvent.changeText(screen.getByLabelText('Confirm password'), 'password123');
    fireEvent.press(screen.getByLabelText('Create account'));

    expect(mockOnSubmit).toHaveBeenCalledWith('Jane', 'Doe', 'jane@example.com', 'password123', 'password123');
  });

  it('calls onNavigateToLogin when the sign-in link is pressed', () => {
    render(
      <RegisterForm
        error={null}
        loading={false}
        onSubmit={mockOnSubmit}
        onNavigateToLogin={mockOnNavigateToLogin}
      />,
    );

    fireEvent.press(screen.getByLabelText('Back to sign in'));

    expect(mockOnNavigateToLogin).toHaveBeenCalled();
  });
});
