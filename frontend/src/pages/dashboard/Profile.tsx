import { useAuthStore } from '../../stores/auth.store';
import { Card, CardContent } from '../../components/ui/Card';
import { User, Shield, Fingerprint, Mail, Hash } from 'lucide-react';

export const Profile = () => {
  const { user } = useAuthStore();

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-end gap-6 p-6 rounded-3xl bg-gradient-to-t from-blue-500/5 to-transparent border border-blue-500/10">
        <div className="w-24 h-24 rounded-2xl bg-neutral-900 border border-neutral-800 flex items-center justify-center shadow-2xl">
          <User className="w-12 h-12 text-blue-500" />
        </div>
        <div className="flex-1 pb-2">
          <h2 className="text-3xl font-black text-white tracking-tighter uppercase italic">
            {user?.email.split('@')[0]}
          </h2>
          <div className="flex items-center gap-3 mt-1">
            <span className="px-2 py-0.5 rounded bg-blue-600 text-[10px] font-bold text-white uppercase tracking-widest">
              {user?.role}
            </span>
            <span className="text-xs text-neutral-600 font-mono tracking-tight">Active Duty Analyst</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-[#050505] border-neutral-900">
          <CardContent className="p-6 space-y-6">
            <div className="flex items-center gap-4">
              <Mail className="text-neutral-700 w-5 h-5" />
              <div>
                <p className="text-[10px] uppercase text-neutral-500 font-bold">Email Address</p>
                <p className="text-sm text-neutral-200">{user?.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Hash className="text-neutral-700 w-5 h-5" />
              <div>
                <p className="text-[10px] uppercase text-neutral-500 font-bold">Unique Operator ID</p>
                <p className="text-sm text-neutral-200 font-mono">{user?.id}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#050505] border-neutral-900">
          <CardContent className="p-6 space-y-4">
            <h4 className="text-xs font-bold text-blue-500 uppercase tracking-widest flex items-center gap-2">
              <Fingerprint className="w-4 h-4" /> Security Clearance
            </h4>
            <p className="text-xs text-neutral-500 leading-relaxed">
              Your account is authorized for <span className="text-white italic">{user?.role}</span> operations. 
              L7 inspection and workspace management privileges are active.
            </p>
            <div className="pt-4 flex gap-2">
              <Shield className="w-4 h-4 text-green-500" />
              <span className="text-[10px] text-green-500 font-bold uppercase">Multi-Factor Authenticated</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};