import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bell, Mail, Shield, Save, Loader2 } from 'lucide-react';
import api from '../lib/api';

const Settings = () => {
  const queryClient = useQueryClient();

  // Fetch current settings (from user profile or specific settings endpoint)
  const { data: user } = useQuery({
    queryKey: ['user-profile'],
    queryFn: async () => (await api.get('/auth/me')).data
  });

  const mutation = useMutation({
    mutationFn: async (updatedSettings: any) => {
      return await api.patch('/management/settings', updatedSettings);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-profile'] });
      alert("System preferences updated successfully.");
    }
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    mutation.mutate({
      alert_email: formData.get('alert_email'),
      enable_email_notifications: formData.get('enable_email') === 'on',
      min_severity_level: formData.get('min_severity')
    });
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">System Settings</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
            <Bell className="text-blue-500 w-5 h-5" />
            <h3 className="text-white font-semibold">Notification Preferences</h3>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-slate-300 font-medium">Email Alerts</label>
                <p className="text-xs text-slate-500">Receive critical intrusion reports via email</p>
              </div>
              <input 
                type="checkbox" 
                name="enable_email"
                defaultChecked={user?.enable_email_notifications}
                className="w-5 h-5 rounded border-slate-700 bg-slate-800 text-blue-600 focus:ring-blue-500" 
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm text-slate-400">Alert Email Destination</label>
              <input 
                type="email" 
                name="alert_email"
                defaultValue={user?.alert_email || user?.email}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg py-2 px-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
            <Shield className="text-amber-500 w-5 h-5" />
            <h3 className="text-white font-semibold">Security Thresholds</h3>
          </div>

          <div className="space-y-2">
            <label className="text-sm text-slate-400">Minimum Notification Severity</label>
            <select 
              name="min_severity"
              defaultValue={user?.min_severity_level || 'high'}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg py-2 px-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="low">Low (All Events)</option>
              <option value="medium">Medium and Above</option>
              <option value="high">High & Critical Only</option>
              <option value="critical">Critical Threats Only</option>
            </select>
          </div>
        </div>

        <button 
          disabled={mutation.isPending}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2"
        >
          {mutation.isPending ? <Loader2 className="animate-spin w-5 h-5" /> : <><Save className="w-5 h-5" /> Synchronize Changes</>}
        </button>
      </form>
    </div>
  );
};

export default Settings;