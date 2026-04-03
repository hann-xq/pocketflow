import { render, screen } from '@testing-library/react-native';
import { TransactionDetailsSection } from '../transaction/detail/TransactionDetailsSection';

describe('TransactionDetailsSection', () => {
  it('renders the formatted date', () => {
    render(
      <TransactionDetailsSection
        date="2024-01-15"
        bankAccountName="My Checking"
        bankAccountNumber="NL02ABNA0123456789"
        counterpartyName="Starbucks"
        counterpartyAccount="NL91ABNA0417164300"
        description={null}
      />,
    );
    expect(screen.getByText('15/01/2024')).toBeTruthy();
  });

  it('renders bank account name and number', () => {
    render(
      <TransactionDetailsSection
        date="2024-01-15"
        bankAccountName="My Checking"
        bankAccountNumber="NL02ABNA0123456789"
        counterpartyName={null}
        counterpartyAccount={null}
        description={null}
      />,
    );
    expect(screen.getByText('My Checking')).toBeTruthy();
    expect(screen.getByText('NL02ABNA0123456789')).toBeTruthy();
  });

  it('renders counterparty name and account', () => {
    render(
      <TransactionDetailsSection
        date="2024-01-15"
        bankAccountName="My Checking"
        bankAccountNumber="NL02ABNA0123456789"
        counterpartyName="Starbucks"
        counterpartyAccount="NL91ABNA0417164300"
        description={null}
      />,
    );
    expect(screen.getByText('Starbucks')).toBeTruthy();
    expect(screen.getByText('NL91ABNA0417164300')).toBeTruthy();
  });

  it('renders the description when present', () => {
    render(
      <TransactionDetailsSection
        date="2024-01-15"
        bankAccountName="My Checking"
        bankAccountNumber="NL02ABNA0123456789"
        counterpartyName={null}
        counterpartyAccount={null}
        description="Monthly subscription"
      />,
    );
    expect(screen.getByText('Description')).toBeTruthy();
    expect(screen.getByText('Monthly subscription')).toBeTruthy();
  });

  it('does not render the description section when description is null', () => {
    render(
      <TransactionDetailsSection
        date="2024-01-15"
        bankAccountName="My Checking"
        bankAccountNumber="NL02ABNA0123456789"
        counterpartyName={null}
        counterpartyAccount={null}
        description={null}
      />,
    );
    expect(screen.queryByText('Description')).toBeNull();
  });
});
