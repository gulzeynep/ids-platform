import { useAuthStore } from '../../stores/auth.store';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Key, ShieldCheck, UserPlus, RefreshCw, Copy, ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';

export const Management = () => {
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'admin';

  // Siyah ekranı engelleyen koruma
  if (!user) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="animate-pulse font-mono text-blue-500">INITIALIZING_SECURE_VAULT...</div>
      </div>
    );
  }

  const copyKey = (key: string) => {
    navigator.clipboard.writeText(key);
    toast.success("API Key copied to clipboard.");
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white uppercase italic tracking-tight">Workspace Control</h2>
          <p className="text-[10px] text-neutral-500 font-mono tracking-tighter">
            {/* ?. kullanımı hayat kurtarır */}
            NODE_ID: {user?.id?.substring(0, 8) || 'N/A'} | AUTH_LVL: {user?.role?.toUpperCase() || 'UNKNOWN'}
          </p>
        </div>
        {isAdmin && (
          <Button variant="primary" size="sm" className="bg-blue-600 hover:bg-blue-700 h-9 rounded-xl">
            <UserPlus className="w-4 h-4 mr-2" /> Add Team Member
          </Button>
        )}
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 border-neutral-800 bg-black/40">
          <CardHeader className="border-b border-neutral-900 pb-4">
            <CardTitle className="text-xs font-mono flex items-center gap-2 text-blue-500">
              <Key className="w-4 h-4" /> INSTANCE_ACCESS_TOKEN
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div className="relative">
              <Input 
                value="WIDS_PRO_69f7ff410b76_SECURE_TOKEN" 
                readOnly 
                className="font-mono text-[10px] bg-black border-neutral-800 pr-20 h-10" 
              />
              <Button 
                variant="ghost" 
                className="absolute right-1 top-1 h-8 text-[10px] hover:bg-white/5"
                onClick={() => copyKey("WIDS_PRO_69f7ff410b76_SECURE_TOKEN")}
              >
                <Copy className="w-3 h-3" />
              </Button>
            </div>
            
            {isAdmin ? (
              <div className="flex items-center justify-between p-4 rounded-2xl bg-red-500/5 border border-red-500/10">
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-red-500 uppercase tracking-widest">Critical Action</p>
                  <p className="text-[10px] text-neutral-500">Key rotation forces sensor re-authentication.</p>
                </div>
                <Button variant="danger" size="sm" className="h-8 rounded-lg text-[10px] font-bold">
                  <RefreshCw className="w-3 h-3 mr-2" /> ROTATE
                </Button>
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-neutral-900/30 border border-neutral-800 flex items-center gap-3">
                <ShieldAlert className="w-4 h-4 text-yellow-600" />
                <p className="text-[10px] text-neutral-500 uppercase font-mono">Elevation required.</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-neutral-900 bg-blue-500/[0.02]">
          <CardHeader>
             <CardTitle className="text-[10px] uppercase tracking-widest text-neutral-600 font-bold">Session Identity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col gap-1">
              <span className="text-[10px] text-neutral-700 uppercase font-mono">Active ID</span>
              <span className="text-xs font-bold text-neutral-200">{user?.email}</span>
            </div>
            <div className="flex flex-col gap-1 pt-2 border-t border-white/5">
              <span className="text-[10px] text-neutral-700 uppercase font-mono">Clearance</span>
              <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded w-fit ${isAdmin ? 'bg-blue-500/10 text-blue-500' : 'bg-green-500/10 text-green-500'}`}>
                {user?.role?.toUpperCase()}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};