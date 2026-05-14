import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import apiClient, { isApiError } from '../../api/client';
import { useAuthStore } from '../../stores/auth.store';
import { Card, CardContent } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { User, Shield, Fingerprint, Mail, Hash, Key } from 'lucide-react';
import { toast } from 'sonner';

export const Profile = () => {
  const { user } = useAuthStore();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const changePasswordMutation = useMutation({
    mutationFn: async () => {
      return apiClient.patch('/auth/change-password', {
        current_password: currentPassword,
        new_password: newPassword
      });
    },
    onSuccess: () => {
      toast.success("Security credentials updated successfully.");
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    },
    onError: (error: unknown) => {
      const detail = isApiError(error) ? (error.response?.data as { detail?: unknown } | undefined)?.detail : undefined;
      const errorMsg = typeof detail === 'string'
        ? detail
        : detail
          ? JSON.stringify(detail)
          : "Failed to update password.";
      toast.error(errorMsg);
    }
  });

  const handleUpdate = () => {
    if (newPassword !== confirmPassword) {
      return toast.error("New passwords do not match.");
    }
    if (newPassword.length < 8) {
      return toast.error("New password must be at least 8 characters.");
    }
    changePasswordMutation.mutate();
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="animate-pulse font-mono text-blue-500">ACCESSING_ENCRYPTED_PROFILE...</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
      
      {/* HEADER BANNER */}
      <div className="flex items-end gap-6 p-8 rounded-[2.5rem] bg-gradient-to-t from-blue-500/10 to-transparent border border-white/5 shadow-2xl">
        <div className="w-24 h-24 rounded-3xl bg-neutral-900 border border-white/10 flex items-center justify-center shadow-inner group">
          <User className="w-12 h-12 text-blue-500 group-hover:scale-110 transition-transform" />
        </div>
        <div className="flex-1 pb-2">
          <h2 className="text-3xl font-black text-white tracking-tighter uppercase italic">
            {user?.email ? user.email.split('@')[0] : 'OPERATOR'}
          </h2>
          <div className="flex items-center gap-3 mt-1">
            <span className="px-3 py-1 rounded-full bg-blue-600/20 border border-blue-500/30 text-[10px] font-bold text-blue-400 uppercase tracking-widest">
              {user?.role || 'ANALYST'}
            </span>
            <span className="text-[10px] text-neutral-600 font-mono uppercase tracking-tight italic">Status: Online // Secure_Session</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* IDENTITY CARD */}
        <Card className="bg-white/[0.02] border-white/5 rounded-[2rem] overflow-hidden">
          <CardContent className="p-8 space-y-6">
            <div className="flex items-center gap-4 group">
              <div className="p-3 rounded-2xl bg-white/5 text-neutral-500 group-hover:text-blue-500 transition-colors">
                <Mail size={20} />
              </div>
              <div>
                <p className="text-[10px] uppercase text-neutral-600 font-bold tracking-widest">Email Address</p>
                <p className="text-sm text-neutral-200 font-medium">{user?.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-4 group">
              <div className="p-3 rounded-2xl bg-white/5 text-neutral-500 group-hover:text-blue-500 transition-colors">
                <Hash size={20} />
              </div>
              <div>
                <p className="text-[10px] uppercase text-neutral-600 font-bold tracking-widest">Unique Operator ID</p>
                <p className="text-sm text-neutral-200 font-mono">{user?.id || 'N/A'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* CLEARANCE CARD (Fake data removed) */}
        <Card className="bg-white/[0.02] border-white/5 rounded-[2rem]">
          <CardContent className="p-8 space-y-4">
            <h4 className="text-xs font-bold text-blue-500 uppercase tracking-[0.2em] flex items-center gap-2">
              <Fingerprint size={16} /> Security Clearance
            </h4>
            <p className="text-xs text-neutral-500 leading-relaxed font-medium">
              This account is authorized as <span className="text-white italic">{user?.role?.toUpperCase()}</span>. Access to the command center and system overrides are strictly monitored and logged.
            </p>
            <div className="pt-6 flex items-center gap-2">
              <Shield size={14} className="text-green-500" />
              <span className="text-[10px] text-green-500/80 font-bold uppercase tracking-tighter">Active Authenticated Session</span> 
            </div>
          </CardContent>
        </Card>
      </div>

      {/* NEW: CREDENTIAL MANAGEMENT CARD */}
      <Card className="bg-white/[0.02] border-white/5 rounded-[2rem] overflow-hidden">
        <CardContent className="p-8 space-y-6">
          <h4 className="text-xs font-bold text-blue-500 uppercase tracking-[0.2em] flex items-center gap-2 mb-4">
            <Key size={16} /> Credential Management
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div>
                <label className="text-[10px] text-neutral-500 uppercase font-bold mb-2 block">Current Password</label>
                <Input 
                  type="password" 
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="bg-black/40 border-white/10 text-white text-sm h-11" 
                />
              </div>
              <div>
                <label className="text-[10px] text-neutral-500 uppercase font-bold mb-2 block">New Password</label>
                <Input 
                  type="password" 
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="bg-black/40 border-white/10 text-white text-sm h-11" 
                />
              </div>
              <div>
                <label className="text-[10px] text-neutral-500 uppercase font-bold mb-2 block">Confirm New Password</label>
                <Input 
                  type="password" 
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="bg-black/40 border-white/10 text-white text-sm h-11" 
                />
              </div>
            </div>
            
            <div className="flex flex-col justify-between bg-black/40 border border-neutral-800 rounded-2xl p-6">
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-white flex items-center gap-2">
                  <Shield className="w-4 h-4 text-blue-500" /> Security Requirements
                </h4>
                <ul className="text-xs text-neutral-500 space-y-2 list-disc list-inside font-medium">
                  <li>Minimum 8 characters length</li>
                  <li>At least one uppercase letter</li>
                  <li>At least one numeric digit</li>
                  <li>At least one special character (!@#$%)</li>
                </ul>
              </div>
              <Button 
                variant="primary" 
                className="w-full bg-blue-600 mt-6 h-11" 
                onClick={handleUpdate}
                isLoading={changePasswordMutation.isPending}
                disabled={!currentPassword || !newPassword || !confirmPassword}
              >
                Update Credentials
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      
    </div>
  );
};
