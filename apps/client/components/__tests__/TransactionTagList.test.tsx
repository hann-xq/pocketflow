import { fireEvent, render, screen } from '@testing-library/react-native';
import { TransactionTagList } from '../transaction/detail/TransactionTagList';
import type { ApiTag } from '@/lib/types';

const tags: ApiTag[] = [
  { id: 'tag-1', name: 'groceries', updatedAt: '2024-01-01T00:00:00.000Z' },
  { id: 'tag-2', name: 'online', updatedAt: '2024-01-01T00:00:00.000Z' },
];

describe('TransactionTagList', () => {
  const onTagPress = jest.fn();
  const onEditTags = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders tag chips for each tag', () => {
    render(<TransactionTagList tags={tags} onTagPress={onTagPress} onEditTags={onEditTags} />);
    expect(screen.getByLabelText('View all transactions tagged groceries')).toBeTruthy();
    expect(screen.getByLabelText('View all transactions tagged online')).toBeTruthy();
  });

  it('calls onTagPress with the tag id and name when a tag chip is pressed', () => {
    render(<TransactionTagList tags={tags} onTagPress={onTagPress} onEditTags={onEditTags} />);
    fireEvent.press(screen.getByLabelText('View all transactions tagged groceries'));
    expect(onTagPress).toHaveBeenCalledWith('tag-1', 'groceries');
  });

  it('renders the pencil edit button', () => {
    render(<TransactionTagList tags={[]} onTagPress={onTagPress} onEditTags={onEditTags} />);
    expect(screen.getByLabelText('Edit tags')).toBeTruthy();
  });

  it('calls onEditTags when the pencil is pressed', () => {
    render(<TransactionTagList tags={[]} onTagPress={onTagPress} onEditTags={onEditTags} />);
    fireEvent.press(screen.getByLabelText('Edit tags'));
    expect(onEditTags).toHaveBeenCalledTimes(1);
  });

  it('shows "Edit tags" text and icon row when tags list is empty', () => {
    render(<TransactionTagList tags={[]} onTagPress={onTagPress} onEditTags={onEditTags} />);
    expect(screen.getByText('Edit tags')).toBeTruthy();
    expect(screen.queryByLabelText(/View all transactions tagged/)).toBeNull();
  });

  it('hides "Edit tags" text when tags are present', () => {
    render(<TransactionTagList tags={tags} onTagPress={onTagPress} onEditTags={onEditTags} />);
    expect(screen.queryByText('Edit tags')).toBeNull();
  });
});
