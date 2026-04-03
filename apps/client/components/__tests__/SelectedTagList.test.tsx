import { fireEvent, render, screen } from '@testing-library/react-native';
import { SelectedTagList } from '../tags/SelectedTagList';
import type { ApiTag } from '@/lib/types';

const tags: ApiTag[] = [
  { id: 't-1', name: 'food', updatedAt: '2024-01-01T00:00:00.000Z' },
  { id: 't-2', name: 'work', updatedAt: '2024-01-01T00:00:00.000Z' },
];

describe('SelectedTagList', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows the empty state when no tags are provided', () => {
    render(<SelectedTagList tags={[]} onRemove={jest.fn()} />);
    expect(screen.getByText('No tags added yet')).toBeTruthy();
  });

  it('does not show the empty state when tags are present', () => {
    render(<SelectedTagList tags={tags} onRemove={jest.fn()} />);
    expect(screen.queryByText('No tags added yet')).toBeNull();
  });

  it('renders a chip for each tag', () => {
    render(<SelectedTagList tags={tags} onRemove={jest.fn()} />);
    expect(screen.getByText('#food')).toBeTruthy();
    expect(screen.getByText('#work')).toBeTruthy();
  });

  it('calls onRemove with the correct tag when its remove button is pressed', () => {
    const onRemove = jest.fn();
    render(<SelectedTagList tags={tags} onRemove={onRemove} />);
    fireEvent.press(screen.getByLabelText('Remove tag food'));
    expect(onRemove).toHaveBeenCalledTimes(1);
    expect(onRemove).toHaveBeenCalledWith(tags[0]);
  });

  it('calls onRemove with the second tag when its remove button is pressed', () => {
    const onRemove = jest.fn();
    render(<SelectedTagList tags={tags} onRemove={onRemove} />);
    fireEvent.press(screen.getByLabelText('Remove tag work'));
    expect(onRemove).toHaveBeenCalledWith(tags[1]);
  });
});
