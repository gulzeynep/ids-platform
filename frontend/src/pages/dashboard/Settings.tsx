import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { BellRing, Mail, Palette, Save, Send, Shield } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { isApiError } from '../../api/client';
import { settingsApi, settingsKeys } from '../../api/endpoints/settings';
import { useUIStore, type AppTheme } from '../../stores/ui.store';
import type { AlertSeverity, UserSettings } from '../../types';

const themeOptions: { value: AppTheme; label: string; description: string }[] = [
  { value: 'dark', label: 'Dark SOC', description: 'High-contrast control room palette.' },
  { value: 'blue', label: 'Ghost Blue', description: 'Cooler blue surfaces for long monitoring sessions.' },
  { value: 'light', label: 'Daylight', description: 'Light theme for bright rooms and reports.' },
];

export const Settings = () => {
  const queryClient = useQueryClient();
  const { theme, setTheme } = useUIStore();
  const defaultSettings: UserSettings = {
    alert_email: '',
    enable_email_notifications: true,
    min_severity_level: 'high',
  };
  const [settingsDraft, setSettingsDraft] = useState<Partial<UserSettings>>({});

  const { data: settings, isLoading } = useQuery({
    queryKey: settingsKeys.all,
    queryFn: settingsApi.getSettings,
  });

  const activeSettings: UserSettings = { ...defaultSettings, ...settings, ...settingsDraft };
  const getErrorMessage = (error: unknown, fallback: string) => {
    if (isApiError(error)) {
      const data = error.response?.data as { detail?: unknown } | undefined;
      const detail = data?.detail;
      return typeof detail === 'string' ? detail : fallback;
    }
    return fallback;
  };

  const saveMutation = useMutation({
    mutationFn: settingsApi.updateSettings,
    onSuccess: (saved) => {
      queryClient.setQueryData(settingsKeys.all, saved);
      toast.success('Settings saved.');
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, 'Settings could not be saved.'));
    },
  });

  const confirmEmailMutation = useMutation({
    mutationFn: async () => {
      const saved = await settingsApi.updateSettings(activeSettings);
      queryClient.setQueryData(settingsKeys.all, saved);
      return settingsApi.sendConfirmationEmail();
    },
    onSuccess: (result) => {
      toast.success(`Confirmation email sent to ${result.recipient}.`);
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, 'Confirmation email could not be sent.'));
    },
  });

  const saveSettings = () => {
    saveMutation.mutate(activeSettings);
  };

  const sendConfirmation = () => {
    const confirmed = window.confirm(`Send a confirmation email to ${activeSettings.alert_email || 'your account email'}?`);
    if (confirmed) {
      confirmEmailMutation.mutate();
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">Platform Settings</h2>
        <p className="text-sm text-neutral-500">Theme, alert delivery, and analyst notification controls.</p>
      </div>

      <Card className="border-neutral-900">
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <BellRing className="w-4 h-4 text-blue-500" /> Alert Delivery
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-4">
            <div>
              <label className="text-sm text-neutral-200 flex items-center gap-2 mb-2">
                <Mail className="w-4 h-4 text-blue-500" /> Alert Email
              </label>
              <Input
                type="email"
                value={activeSettings.alert_email ?? ''}
                onChange={(event) => setSettingsDraft((draft) => ({ ...draft, alert_email: event.target.value }))}
                placeholder="soc@example.com"
                disabled={isLoading}
              />
            </div>
            <Button
              variant="secondary"
              className="self-end"
              onClick={sendConfirmation}
              isLoading={confirmEmailMutation.isPending}
              disabled={isLoading || !activeSettings.enable_email_notifications}
            >
              <Send className="w-4 h-4 mr-2" /> Send Confirmation
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-neutral-900 pt-6">
            <label className="flex items-center justify-between rounded-lg border border-neutral-900 bg-black/30 p-4 cursor-pointer">
              <div>
                <p className="text-sm text-neutral-200">Email Notifications</p>
                <p className="text-xs text-neutral-500">Send security mail when severity reaches the threshold.</p>
              </div>
              <input
                type="checkbox"
                checked={activeSettings.enable_email_notifications}
                onChange={(event) => setSettingsDraft((draft) => ({ ...draft, enable_email_notifications: event.target.checked }))}
                className="h-5 w-5 accent-blue-600"
              />
            </label>

            <div className="rounded-lg border border-neutral-900 bg-black/30 p-4">
              <label className="text-sm text-neutral-200 flex items-center gap-2 mb-2">
                <Shield className="w-4 h-4 text-blue-500" /> Minimum Severity
              </label>
              <select
                className="h-10 w-full rounded-md border border-neutral-800 bg-[#111] px-3 text-sm text-neutral-200 outline-none focus:ring-2 focus:ring-blue-500"
                value={activeSettings.min_severity_level}
                onChange={(event) => setSettingsDraft((draft) => ({ ...draft, min_severity_level: event.target.value as AlertSeverity }))}
              >
                <option value="low">Low and above</option>
                <option value="medium">Medium and above</option>
                <option value="high">High and critical</option>
                <option value="critical">Critical only</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-neutral-900">
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Palette className="w-4 h-4 text-blue-500" /> Dashboard Theme
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {themeOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => setTheme(option.value)}
              className={`text-left rounded-lg border p-4 transition-colors ${theme === option.value ? 'border-blue-500 bg-blue-500/10' : 'border-neutral-900 bg-black/30 hover:border-neutral-700'}`}
            >
              <p className="text-sm font-bold text-white">{option.label}</p>
              <p className="mt-1 text-xs text-neutral-500">{option.description}</p>
            </button>
          ))}
        </CardContent>
      </Card>

      <Button className="w-full md:w-fit" onClick={saveSettings} isLoading={saveMutation.isPending}>
        <Save className="w-4 h-4 mr-2" /> Save Configurations
      </Button>
    </div>
  );
};
