import { fireEvent, render, screen } from '@testing-library/react-native';
import { TransactionDetailHeader } from '../transaction/detail/TransactionDetailHeader';

describe('TransactionDetailHeader', () => {
  const onBack = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the title', () => {
    render(<TransactionDetailHeader title="Starbucks" onBack={onBack} />);
    expect(screen.getByText('Starbucks')).toBeTruthy();
  });

  it('renders an empty title when blank', () => {
    render(<TransactionDetailHeader title="" onBack={onBack} />);
    expect(screen.getByLabelText('Go back')).toBeTruthy();
  });

  it('calls onBack when the back button is pressed', () => {
    render(<TransactionDetailHeader title="Starbucks" onBack={onBack} />);
    fireEvent.press(screen.getByLabelText('Go back'));
    expect(onBack).toHaveBeenCalledTimes(1);
  });
});
