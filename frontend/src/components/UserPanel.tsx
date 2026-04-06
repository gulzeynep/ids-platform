import { useEffect, useState } from 'react';
import { User, Key, Eye, EyeOff, Shield } from 'lucide-react';
import api from '../lib/api';

interface UserProfile {
  username: string;
  email: string;
  role: string;
  company_name: string;
}

export default function UserPanel() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [showKey, setShowKey] = useState(false);

  // NOT: Gerçek projede API Key'i ayrı bir güvenli endpoint'ten çekmek daha iyidir.
  // Şimdilik /auth/me'den gelmediği için statik bir placeholder koyuyoruz veya ekletebiliriz.
  const apiKey = "ids_5273b724f61a4a96fdb2cb4fd1d3c808"; 

  useEffect(() => {
    api.get('/auth/me').then(res => setProfile(res.data)).catch(console.error);
  }, []);

  if (!profile) return null;

  return (
    <div className="animate-in fade-in duration-500 max-w-[800px] mx-auto p-6 mt-10">
      <div className="bg-[#0a0a0a] border border-white/5 rounded-[32px] p-8 relative overflow-hidden">
        {/* Dekoratif arkaplan efekti */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        
        <div className="flex items-center gap-6 mb-10 relative z-10">
          <div className="w-20 h-20 bg-blue-500/10 border border-blue-500/20 rounded-full flex items-center justify-center text-blue-500">
            <User size={32} />
          </div>
          <div>
            <h2 className="text-3xl font-black text-white">{profile.username}</h2>
            <p className="text-slate-400 font-mono text-sm">{profile.email}</p>
            <div className="mt-2 inline-block px-3 py-1 bg-white/5 border border-white/10 rounded-md text-[10px] font-black uppercase text-slate-300">
              {profile.role} @ {profile.company_name}
            </div>
          </div>
        </div>

        <div className="space-y-4 relative z-10">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest border-b border-white/5 pb-2 mb-4">Security Credentials</h3>
          
          <div className="p-4 bg-black/50 border border-white/5 rounded-xl">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-sm text-slate-400 font-bold">
                <Key size={16} /> Sensor API Key
              </div>
              <button 
                onClick={() => setShowKey(!showKey)} 
                className="text-slate-500 hover:text-white transition-colors"
              >
                {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <p className="text-xs text-slate-500 mb-3">Use this key to authenticate your perimeter sensors with the W-IDS Core.</p>
            <div className="font-mono text-sm bg-[#050505] p-3 rounded-lg border border-white/5 text-blue-400 break-all">
              {showKey ? apiKey : 'ids_' + '•'.repeat(32)}
            </div>
          </div>
          
          <div className="p-4 bg-green-500/5 border border-green-500/10 rounded-xl flex items-start gap-3">
            <Shield className="text-green-500 mt-0.5" size={16} />
            <div>
              <h4 className="text-sm font-bold text-green-500">Account Secure</h4>
              <p className="text-xs text-slate-400 mt-1">Your SOC account is active and connected to the central database.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}