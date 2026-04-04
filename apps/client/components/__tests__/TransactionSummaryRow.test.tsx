import { render, screen } from '@testing-library/react-native';
import { TransactionSummaryRow } from '../transaction/detail/TransactionSummaryRow';

describe('TransactionSummaryRow', () => {
  it('renders the display name and expense amount', () => {
    render(
      <TransactionSummaryRow
        displayName="Starbucks"
        description={null}
        amount={-3.5}
        isExpense={true}
      />,
    );
    expect(screen.getByText('Starbucks')).toBeTruthy();
    expect(screen.getByText('-€3.50')).toBeTruthy();
  });

  it('renders a + prefix for income', () => {
    render(
      <TransactionSummaryRow
        displayName="Salary"
        description={null}
        amount={2500}
        isExpense={false}
      />,
    );
    expect(screen.getByText('+€2,500.00')).toBeTruthy();
  });

  it('falls back to description when displayName is empty', () => {
    render(
      <TransactionSummaryRow
        displayName=""
        description="Direct debit"
        amount={-10}
        isExpense={true}
      />,
    );
    expect(screen.getByText('Direct debit')).toBeTruthy();
  });

  it('shows "Unknown" when both displayName and description are absent', () => {
    render(
      <TransactionSummaryRow
        displayName=""
        description={null}
        amount={-5}
        isExpense={true}
      />,
    );
    expect(screen.getByText('Unknown')).toBeTruthy();
  });

  it('has an accessibility label reflecting name and amount', () => {
    render(
      <TransactionSummaryRow
        displayName="Netflix"
        description={null}
        amount={-15.99}
        isExpense={true}
      />,
    );
    expect(screen.getByLabelText('Netflix, -€15.99')).toBeTruthy();
  });
});
