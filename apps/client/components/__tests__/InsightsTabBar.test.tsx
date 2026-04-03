import { fireEvent, render, screen } from '@testing-library/react-native';
import { InsightsTabBar } from '../insights/InsightsTabBar';

describe('InsightsTabBar', () => {
  const onTabChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders both tabs', () => {
    render(<InsightsTabBar activeTab="spendings" onTabChange={onTabChange} />);
    expect(screen.getByLabelText('Spendings tab')).toBeTruthy();
    expect(screen.getByLabelText('Income tab')).toBeTruthy();
  });

  it('marks the active tab as selected', () => {
    render(<InsightsTabBar activeTab="spendings" onTabChange={onTabChange} />);
    expect(screen.getByLabelText('Spendings tab')).toBeSelected();
    expect(screen.getByLabelText('Income tab')).not.toBeSelected();
  });

  it('marks the income tab as selected when activeTab is income', () => {
    render(<InsightsTabBar activeTab="income" onTabChange={onTabChange} />);
    expect(screen.getByLabelText('Income tab')).toBeSelected();
    expect(screen.getByLabelText('Spendings tab')).not.toBeSelected();
  });

  it('calls onTabChange with "income" when the income tab is pressed', () => {
    render(<InsightsTabBar activeTab="spendings" onTabChange={onTabChange} />);
    fireEvent.press(screen.getByLabelText('Income tab'));
    expect(onTabChange).toHaveBeenCalledWith('income');
  });

  it('calls onTabChange with "spendings" when the spendings tab is pressed', () => {
    render(<InsightsTabBar activeTab="income" onTabChange={onTabChange} />);
    fireEvent.press(screen.getByLabelText('Spendings tab'));
    expect(onTabChange).toHaveBeenCalledWith('spendings');
  });

  it('calls onTabChange exactly once per press', () => {
    render(<InsightsTabBar activeTab="spendings" onTabChange={onTabChange} />);
    fireEvent.press(screen.getByLabelText('Income tab'));
    expect(onTabChange).toHaveBeenCalledTimes(1);
  });
});
