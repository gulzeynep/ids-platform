// src/pages/dashboard/Profile.tsx
import { useAuthStore } from '../../stores/auth.store';
import { Card, CardContent } from '../../components/ui/Card';
import { User, Shield, Fingerprint, Mail, Hash } from 'lucide-react';

export const Profile = () => {
  const { user } = useAuthStore();

  // SİYAH EKRAN KORUMASI: User yüklenene kadar boş dönme, yükleniyor göster
  if (!user) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="animate-pulse font-mono text-blue-500">ACCESSING_ENCRYPTED_PROFILE...</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
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

        <Card className="bg-white/[0.02] border-white/5 rounded-[2rem]">
          <CardContent className="p-8 space-y-4">
            <h4 className="text-xs font-bold text-blue-500 uppercase tracking-[0.2em] flex items-center gap-2">
              <Fingerprint size={16} /> Security Clearance
            </h4>
            <p className="text-xs text-neutral-500 leading-relaxed font-medium">
              Bu hesap <span className="text-white italic">{user?.role?.toUpperCase()}</span> operasyonları için yetkilendirilmiştir. 
              Katman 7 denetimi ve tehdit istihbaratı erişimi aktiftir.
            </p>
            <div className="pt-6 flex items-center gap-2">
              <Shield size={14} className="text-green-500" />
              <span className="text-[10px] text-green-500/80 font-bold uppercase tracking-tighter">Session Secured via SSL/TLS 1.3</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};