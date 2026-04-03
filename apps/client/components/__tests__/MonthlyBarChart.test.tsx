import { render, screen } from '@testing-library/react-native';
import { MonthlyBarChart, type MonthData } from '../insights/MonthlyBarChart';

const months: MonthData[] = [
  { key: '2026-01', label: 'Jan', isCurrent: false, total: 500 },
  { key: '2026-02', label: 'Feb', isCurrent: false, total: 1500 },
  { key: '2026-03', label: 'Mar', isCurrent: false, total: 0 },
  { key: '2026-04', label: 'Apr', isCurrent: true, total: 2500 },
];

describe('MonthlyBarChart', () => {
  it('renders an accessible entry for each month', () => {
    render(<MonthlyBarChart data={months} max={2500} />);
    expect(screen.getByLabelText('Jan: €500')).toBeTruthy();
    expect(screen.getByLabelText('Feb: €1,500')).toBeTruthy();
    expect(screen.getByLabelText('Mar: €0')).toBeTruthy();
    expect(screen.getByLabelText('Apr: €2,500')).toBeTruthy();
  });

  it('renders all month labels', () => {
    render(<MonthlyBarChart data={months} max={2500} />);
    expect(screen.getByText('Jan')).toBeTruthy();
    expect(screen.getByText('Feb')).toBeTruthy();
    expect(screen.getByText('Mar')).toBeTruthy();
    expect(screen.getByText('Apr')).toBeTruthy();
  });

  it('formats amounts under 1000 without a k suffix', () => {
    render(<MonthlyBarChart data={months} max={2500} />);
    expect(screen.getByLabelText('Jan: €500')).toBeTruthy();
  });

  it('formats amounts of 1000 or more with commas', () => {
    render(<MonthlyBarChart data={months} max={2500} />);
    expect(screen.getByLabelText('Feb: €1,500')).toBeTruthy();
    expect(screen.getByLabelText('Apr: €2,500')).toBeTruthy();
  });

  it('shows €0 for a month with no transactions', () => {
    render(<MonthlyBarChart data={months} max={2500} />);
    expect(screen.getByLabelText('Mar: €0')).toBeTruthy();
  });

  it('renders a single month', () => {
    render(
      <MonthlyBarChart
        data={[{ key: '2026-04', label: 'Apr', isCurrent: true, total: 100 }]}
        max={100}
      />
    );
    expect(screen.getByLabelText('Apr: €100')).toBeTruthy();
  });
});
