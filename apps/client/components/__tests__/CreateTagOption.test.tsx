import { fireEvent, render, screen } from '@testing-library/react-native';
import { CreateTagOption } from '../tags/CreateTagOption';

describe('CreateTagOption', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the tag name in the label text', () => {
    render(<CreateTagOption tagName="breakfast" onPress={jest.fn()} />);
    expect(screen.getByText('Create "#breakfast"')).toBeTruthy();
  });

  it('calls onPress when the row is pressed', () => {
    const onPress = jest.fn();
    render(<CreateTagOption tagName="breakfast" onPress={onPress} />);
    fireEvent.press(screen.getByLabelText('Create tag breakfast'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('uses the tag name in the accessibility label', () => {
    render(<CreateTagOption tagName="lunch" onPress={jest.fn()} />);
    expect(screen.getByLabelText('Create tag lunch')).toBeTruthy();
  });
});
