import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Settings } from './Settings';
import { settingsApi } from '../../api/endpoints/settings';
import { renderWithProviders } from '../../test/render';

vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

vi.mock('../../api/endpoints/settings', () => ({
  settingsKeys: { all: ['settings'] },
  settingsApi: {
    getSettings: vi.fn(),
    updateSettings: vi.fn(),
    sendConfirmationEmail: vi.fn(),
  },
}));

const mockedSettingsApi = vi.mocked(settingsApi);

describe('Settings', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('saves the active email settings before sending a confirmation email', async () => {
    const user = userEvent.setup();
    mockedSettingsApi.getSettings.mockResolvedValue({
      alert_email: 'soc@example.com',
      enable_email_notifications: true,
      min_severity_level: 'high',
    });
    mockedSettingsApi.updateSettings.mockResolvedValue({
      alert_email: 'alerts@example.com',
      enable_email_notifications: true,
      min_severity_level: 'critical',
    });
    mockedSettingsApi.sendConfirmationEmail.mockResolvedValue({
      status: 'sent',
      recipient: 'alerts@example.com',
    });
    vi.spyOn(window, 'confirm').mockReturnValue(true);

    renderWithProviders(<Settings />, { route: '/settings' });

    const emailInput = await screen.findByDisplayValue('soc@example.com');
    await user.clear(emailInput);
    await user.type(emailInput, 'alerts@example.com');
    await user.selectOptions(screen.getByDisplayValue('High and critical'), 'critical');
    await user.click(screen.getByRole('button', { name: /send confirmation/i }));

    await waitFor(() => {
      expect(mockedSettingsApi.updateSettings).toHaveBeenCalledWith(
        expect.objectContaining({
          alert_email: 'alerts@example.com',
          min_severity_level: 'critical',
        }),
      );
      expect(mockedSettingsApi.sendConfirmationEmail).toHaveBeenCalled();
    });
  });
});
