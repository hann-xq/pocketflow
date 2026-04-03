import { fireEvent, render, screen } from '@testing-library/react-native';
import { TagInput } from '../tags/TagInput';

describe('TagInput', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders with the given value', () => {
    render(<TagInput value="hello" onChangeText={jest.fn()} />);
    expect(screen.getByLabelText('Tag name input').props.value).toBe('hello');
  });

  it('renders an empty input when value is empty', () => {
    render(<TagInput value="" onChangeText={jest.fn()} />);
    expect(screen.getByLabelText('Tag name input').props.value).toBe('');
  });

  it('calls onChangeText when the user types', () => {
    const onChangeText = jest.fn();
    render(<TagInput value="" onChangeText={onChangeText} />);
    fireEvent.changeText(screen.getByLabelText('Tag name input'), 'food');
    expect(onChangeText).toHaveBeenCalledWith('food');
  });
});
