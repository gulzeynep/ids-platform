import apiClient from '../client';
import type { UserSettings } from '../../types';

export const settingsApi = {
  getSettings: async (): Promise<UserSettings> => {
    const response = await apiClient.get('/management/settings');
    return response.data;
  },

  updateSettings: async (settings: Partial<UserSettings>): Promise<UserSettings> => {
    const response = await apiClient.patch('/management/settings', {
      ...settings,
      alert_email: settings.alert_email?.trim() || null,
    });
    return response.data;
  },

  sendConfirmationEmail: async (): Promise<{ status: string; recipient: string }> => {
    const response = await apiClient.post('/management/settings/test-email');
    return response.data;
  },
};

export const settingsKeys = {
  all: ['settings'] as const,
};
