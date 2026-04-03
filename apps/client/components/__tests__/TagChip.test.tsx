import { fireEvent, render, screen } from '@testing-library/react-native';
import { TagChip } from '../tags/TagChip';
import type { ApiTag } from '@/lib/types';

const tag: ApiTag = { id: 't-1', name: 'food', updatedAt: '2024-01-01T00:00:00.000Z' };

describe('TagChip', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the tag name', () => {
    render(<TagChip tag={tag} onRemove={jest.fn()} />);
    expect(screen.getByText('#food')).toBeTruthy();
  });

  it('calls onRemove when the remove button is pressed', () => {
    const onRemove = jest.fn();
    render(<TagChip tag={tag} onRemove={onRemove} />);
    fireEvent.press(screen.getByLabelText('Remove tag food'));
    expect(onRemove).toHaveBeenCalledTimes(1);
  });

  it('uses the tag name in the remove button label', () => {
    const other: ApiTag = { id: 't-2', name: 'work', updatedAt: '2024-01-01T00:00:00.000Z' };
    render(<TagChip tag={other} onRemove={jest.fn()} />);
    expect(screen.getByLabelText('Remove tag work')).toBeTruthy();
  });
});
