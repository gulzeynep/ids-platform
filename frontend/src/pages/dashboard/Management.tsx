// src/pages/dashboard/Management.tsx
import { useAuthStore } from '../../stores/auth.store';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Key, ShieldCheck, UserPlus, RefreshCw, Copy, ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';

export const Management = () => {
  const { user, token } = useAuthStore();
  const isAdmin = user?.role === 'admin';

  const copyKey = (key: string) => {
    navigator.clipboard.writeText(key);
    toast.success("API Key panoya kopyalandı.");
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Workspace Control</h2>
          <p className="text-sm text-neutral-500 font-mono tracking-tighter">
            NODE_ID: {user?.id.substring(0, 8)} | AUTH_LVL: {user?.role.toUpperCase()}
          </p>
        </div>
        {isAdmin && (
          <Button variant="primary" size="sm" className="bg-blue-600 hover:bg-blue-700">
            <UserPlus className="w-4 h-4 mr-2" /> Add Team Member
          </Button>
        )}
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Güvenlik Anahtarı Bölümü */}
        <Card className="lg:col-span-2 border-neutral-800 bg-[#050505]">
          <CardHeader className="border-b border-neutral-900 pb-4">
            <CardTitle className="text-sm font-mono flex items-center gap-2">
              <Key className="w-4 h-4 text-blue-500" /> INSTANCE_ACCESS_TOKEN
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div className="relative">
              <Input 
                value="WIDS_PRO_69f7ff410b76_SECURE_TOKEN" // Repodaki alembic versiyonlarına atıf
                readOnly 
                className="font-mono text-[10px] bg-black border-neutral-800 pr-20" 
              />
              <Button 
                variant="ghost" 
                className="absolute right-1 top-1 h-8 text-[10px]"
                onClick={() => copyKey("WIDS_PRO_69f7ff410b76_SECURE_TOKEN")}
              >
                <Copy className="w-3 h-3" />
              </Button>
            </div>
            
            {isAdmin ? (
              <div className="flex items-center justify-between p-4 rounded-lg bg-red-500/5 border border-red-500/20">
                <div className="space-y-1">
                  <p className="text-xs font-bold text-red-500 uppercase">Critical Action</p>
                  <p className="text-[10px] text-neutral-400">Rotating the key will disconnect all active sensors immediately.</p>
                </div>
                <Button variant="danger" size="sm" className="h-9 px-4 text-xs font-bold">
                  <RefreshCw className="w-3.5 h-3.5 mr-2" /> ROTATE
                </Button>
              </div>
            ) : (
              <div className="p-4 rounded-lg bg-neutral-900/50 border border-neutral-800 flex items-center gap-3">
                <ShieldAlert className="w-5 h-5 text-yellow-600" />
                <p className="text-[10px] text-neutral-500 uppercase tracking-widest">
                  Elevation required for key management.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Kullanıcı Bilgisi Özeti */}
        <Card className="border-neutral-900 bg-blue-500/[0.02]">
          <CardHeader>
            <CardTitle className="text-xs uppercase tracking-widest text-neutral-500">Session Identity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col gap-1">
              <span className="text-[10px] text-neutral-600 uppercase">Active Identity</span>
              <span className="text-sm font-bold text-white">{user?.email}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[10px] text-neutral-600 uppercase">Privilege Level</span>
              <span className={`text-xs font-mono font-bold ${isAdmin ? 'text-blue-500' : 'text-green-500'}`}>
                {user?.role.toUpperCase()}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};