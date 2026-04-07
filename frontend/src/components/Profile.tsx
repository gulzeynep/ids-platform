import { useEffect, useState } from 'react';
import { User, Mail, Building, ShieldCheck, Clock, Key } from 'lucide-react';
import api from '../lib/api';

export default function Profile() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Backend'den giriş yapmış kullanıcının bilgilerini çekiyoruz
    const fetchProfile = async () => {
      try {
        const res = await api.get('/auth/me'); // Backend'de böyle bir endpoint olmalı
        setUser(res.data);
      } catch (error) {
        console.error("Could not retrieve:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  if (loading) {
    return (
      <div className="h-full w-full flex items-center justify-center p-20">
        <div className="w-8 h-8 border-2 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Eğer kullanıcı verisi yoksa hata ekranı
  if (!user) {
    return <div className="text-white p-8">User information can not be retrieved, Please login again. </div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-8 animate-in fade-in duration-500">
      
      <div className="mb-10">
        <h2 className="text-3xl font-black italic text-white uppercase tracking-tighter">Profile</h2>
        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.3em] mt-1">Identity and Access Management</p>
      </div>

      <div className="bg-[#0a0a0a] border border-white/5 rounded-[40px] p-10 shadow-2xl relative overflow-hidden">
        
        {/* Dekoratif Arka Plan */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>

        <div className="flex items-center gap-8 mb-12 relative z-10">
          <div className="w-24 h-24 bg-blue-600/20 border border-blue-500/30 rounded-3xl flex items-center justify-center text-blue-500 shadow-[0_0_30px_rgba(37,99,235,0.2)]">
            <User size={40} />
          </div>
          <div>
            <h3 className="text-3xl font-black text-white italic uppercase tracking-tight">{user.full_name || 'Classified User'}</h3>
            <div className="flex items-center gap-3 mt-2">
               <span className="bg-blue-500/10 text-blue-500 border border-blue-500/20 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                  <ShieldCheck size={12}/> {user.role || 'Analyst'}
               </span>
               <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${user.is_active ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'}`}>
                  {user.is_active ? 'Active Clearance' : 'Suspended'}
               </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
          <ProfileField icon={<Mail size={16}/>} label="Comm Channel (Email)" value={user.email} />
          <ProfileField icon={<Building size={16}/>} label="Organization / Company" value={user.company || 'W-IDS Command'} />
          <ProfileField icon={<Clock size={16}/>} label="Account Created" value={new Date(user.created_at).toLocaleDateString() || 'N/A'} />
          <ProfileField icon={<Key size={16}/>} label="Last Login" value="Current Session" />
        </div>

        <div className="mt-12 pt-8 border-t border-white/5 relative z-10 flex gap-4">
           <button className="px-6 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">
              Update Credentials
           </button>
           <button className="px-6 py-3 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border border-red-500/20">
              Revoke Access
           </button>
        </div>

      </div>
    </div>
  );
}

// Yardımcı Bileşen
function ProfileField({ icon, label, value }: { icon: any, label: string, value: string }) {
  return (
    <div className="p-5 bg-white/[0.02] border border-white/5 rounded-2xl group hover:border-white/10 transition-all">
      <div className="flex items-center gap-2 text-slate-500 mb-2">
        {icon}
        <span className="text-[9px] font-black uppercase tracking-[0.2em]">{label}</span>
      </div>
      <p className="text-sm font-bold text-white font-mono">{value}</p>
    </div>
  );
}