import { fireEvent, render, screen } from '@testing-library/react-native';
import { SettingsSection } from '../profile/SettingsSection';

const baseProps = {
  biometricEnabled: false,
  biometricAvailable: true,
  onToggleBiometric: jest.fn(),
};

describe('SettingsSection', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the Settings header', () => {
    render(<SettingsSection {...baseProps} />);
    expect(screen.getByText('Settings')).toBeTruthy();
  });

  it('renders the biometric toggle row', () => {
    render(<SettingsSection {...baseProps} />);
    expect(screen.getByText('Biometric Authentication')).toBeTruthy();
  });

  it('does not show unavailability notice when biometric is available', () => {
    render(<SettingsSection {...baseProps} biometricAvailable={true} />);
    expect(screen.queryByText('No biometric option available on this device')).toBeNull();
  });

  it('shows unavailability notice when biometric is not available', () => {
    render(<SettingsSection {...baseProps} biometricAvailable={false} />);
    expect(screen.getByText('No biometric option available on this device')).toBeTruthy();
  });

  it('toggle is disabled when biometric is not available', () => {
    render(<SettingsSection {...baseProps} biometricAvailable={false} />);
    expect(screen.getByLabelText('Biometric authentication')).toBeDisabled();
  });

  it('toggle is enabled when biometric is available', () => {
    render(<SettingsSection {...baseProps} biometricAvailable={true} />);
    expect(screen.getByLabelText('Biometric authentication')).not.toBeDisabled();
  });

  it('calls onToggleBiometric with true when toggled on', () => {
    render(<SettingsSection {...baseProps} biometricEnabled={false} />);
    fireEvent(screen.getByLabelText('Biometric authentication'), 'valueChange', true);
    expect(baseProps.onToggleBiometric).toHaveBeenCalledWith(true);
  });

  it('calls onToggleBiometric with false when toggled off', () => {
    render(<SettingsSection {...baseProps} biometricEnabled={true} />);
    fireEvent(screen.getByLabelText('Biometric authentication'), 'valueChange', false);
    expect(baseProps.onToggleBiometric).toHaveBeenCalledWith(false);
  });
});
