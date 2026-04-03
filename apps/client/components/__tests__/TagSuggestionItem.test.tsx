import { fireEvent, render, screen } from '@testing-library/react-native';
import { TagSuggestionItem } from '../tags/TagSuggestionItem';
import type { ApiTag } from '@/lib/types';

const tag: ApiTag = { id: 't-1', name: 'food', updatedAt: '2024-01-01T00:00:00.000Z' };

describe('TagSuggestionItem', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the tag name', () => {
    render(<TagSuggestionItem tag={tag} onPress={jest.fn()} />);
    expect(screen.getByText('#food')).toBeTruthy();
  });

  it('calls onPress when the row is pressed', () => {
    const onPress = jest.fn();
    render(<TagSuggestionItem tag={tag} onPress={onPress} />);
    fireEvent.press(screen.getByLabelText('Add tag food'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('uses the tag name in the accessibility label', () => {
    const other: ApiTag = { id: 't-2', name: 'work', updatedAt: '2024-01-01T00:00:00.000Z' };
    render(<TagSuggestionItem tag={other} onPress={jest.fn()} />);
    expect(screen.getByLabelText('Add tag work')).toBeTruthy();
  });
});
