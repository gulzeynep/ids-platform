import { useEffect, useState } from 'react';
import { 
  Users, Building2, ShieldCheck, Mail, Plus, Trash2, 
  ShieldAlert, Zap, Bell, Globe, ArrowRight, Activity 
} from 'lucide-react';
import api from '../lib/api';

interface UserProfile {
  id: number;
  username: string;
  email: string;
  role: string;
  company_name: string;
}

interface CompanyInfo {
  id: number;
  name: string;
  plan: string;
  created_at: string;
}

export default function Management() {
  const [me, setMe] = useState<UserProfile | null>(null);
  const [team, setTeam] = useState<UserProfile[]>([]);
  const [companies, setCompanies] = useState<CompanyInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'org' | 'notifications'>('org');

  // Static notifications for demo (Later we can fetch these from DB)
  const [notifications] = useState([
    { id: 1, title: "Kernel Update", body: "W-IDS Core Engine v1.0.4 is now live. WebSocket latency improved by 12ms.", type: "system", time: "2h ago" },
    { id: 2, title: "Security Advisory", body: "New SQL Injection patterns detected in the wild. Update your sensor rules.", type: "security", time: "5h ago" },
    { id: 3, title: "Node Connection", body: "Main Server Node-01 successfully established a handshake with the backend.", type: "success", time: "1d ago" }
  ]);

  useEffect(() => {
    const initManagement = async () => {
      try {
        const meRes = await api.get('/auth/me');
        setMe(meRes.data);

        if (meRes.data.role === 'super_admin') {
          const compRes = await api.get('/management/all-companies');
          setCompanies(compRes.data);
        } else if (meRes.data.role === 'admin') {
          const teamRes = await api.get('/management/team');
          setTeam(teamRes.data);
        }
      } catch (error) {
        console.error("Management Init Error:", error);
      } finally {
        setLoading(false);
      }
    };
    initManagement();
  }, []);

  if (loading) return <div className="p-20 text-center animate-pulse text-slate-500 font-black italic tracking-widest uppercase">Initializing Command Center...</div>;

  return (
    <div className="max-w-[1600px] mx-auto p-8 animate-in fade-in duration-500">
      
      {/* HEADER SECTION */}
      <div className="mb-10 border-b border-white/5 pb-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h2 className="text-4xl font-black italic tracking-tighter text-white">
            {me?.role === 'super_admin' ? 'GLOBAL OVERSIGHT' : 'ORGANIZATION CONTROL'}
          </h2>
          <p className="text-slate-500 text-[10px] uppercase tracking-[0.4em] mt-2 font-bold leading-relaxed">
            {me?.role === 'super_admin' ? 'Master Administration & System Health' : `Platform Management: ${me?.company_name}`}
          </p>
        </div>

        {/* TAB SELECTOR */}
        <div className="flex gap-2 bg-white/5 p-1.5 rounded-2xl border border-white/10 shadow-2xl">
          <button 
            onClick={() => setActiveTab('org')}
            className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === 'org' ? 'bg-blue-600 text-white shadow-[0_0_20px_rgba(37,99,235,0.4)]' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}
          >
            <Globe size={14}/> {me?.role === 'super_admin' ? 'Network' : 'Team'}
          </button>
          <button 
            onClick={() => setActiveTab('notifications')}
            className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === 'notifications' ? 'bg-indigo-600 text-white shadow-[0_0_20px_rgba(79,70,229,0.4)]' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}
          >
            <Bell size={14}/> Feed
          </button>
        </div>
      </div>

      {activeTab === 'org' ? (
        <div className="space-y-8 animate-in slide-in-from-left-4 duration-500">
          
          {/* DEVELOPER (SUPER ADMIN) VIEW */}
          {me?.role === 'super_admin' && (
            <div className="grid grid-cols-12 gap-8">
              <div className="col-span-12 lg:col-span-4 p-10 bg-[#0a0a0a] border border-white/5 rounded-[48px] relative overflow-hidden group">
                <div className="absolute -top-4 -right-4 p-8 opacity-5 group-hover:opacity-10 transition-opacity rotate-12">
                  <Zap size={150} className="text-blue-500" />
                </div>
                <h3 className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-4">Total Registered Clients</h3>
                <p className="text-6xl font-black text-white italic tracking-tighter">{companies.length}</p>
                <div className="mt-8 flex items-center gap-2 text-green-500 text-[10px] font-black uppercase italic">
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span> All Systems Operational
                </div>
              </div>

              <div className="col-span-12 lg:col-span-8 bg-[#0a0a0a] border border-white/5 rounded-[48px] overflow-hidden shadow-2xl">
                <div className="p-8 border-b border-white/5 flex items-center justify-between bg-white/[0.01]">
                   <h4 className="font-bold text-xs uppercase tracking-[0.2em] text-slate-400 flex items-center gap-3">
                     <Building2 size={16} className="text-blue-500"/> Partner Organizations
                   </h4>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-white/5 text-[9px] uppercase font-black text-slate-500 tracking-widest">
                      <tr>
                        <th className="px-8 py-5">Organization</th>
                        <th className="px-8 py-5">Tier</th>
                        <th className="px-8 py-5">Deployed On</th>
                        <th className="px-8 py-5 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {companies.map(c => (
                        <tr key={c.id} className="hover:bg-blue-500/[0.02] transition-colors group cursor-default">
                          <td className="px-8 py-5 text-sm font-bold text-white group-hover:text-blue-400">{c.name}</td>
                          <td className="px-8 py-5">
                            <span className="px-2 py-1 rounded-md bg-white/5 border border-white/10 text-[9px] font-mono text-slate-400">{c.plan}</span>
                          </td>
                          <td className="px-8 py-5 text-[10px] text-slate-500 font-mono italic">{new Date(c.created_at).toLocaleDateString()}</td>
                          <td className="px-8 py-5 text-right">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/10 text-green-500 text-[9px] font-black uppercase border border-green-500/20">Active</div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* COMPANY ADMIN VIEW */}
          {me?.role === 'admin' && (
            <div className="space-y-8">
              <div className="flex justify-between items-center">
                 <h3 className="text-xl font-black text-white italic tracking-tight flex items-center gap-4 uppercase">
                   <Users className="text-blue-500" size={24} /> Security Personnel
                 </h3>
                 <button className="flex items-center gap-3 px-8 py-4 bg-white text-black hover:bg-slate-200 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-[0_20px_40px_rgba(255,255,255,0.05)]">
                   <Plus size={16} /> Deploy Analyst
                 </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {team.map(member => (
                  <div key={member.id} className="p-8 bg-[#0a0a0a] border border-white/5 rounded-[40px] hover:border-blue-500/30 transition-all group relative overflow-hidden">
                    <div className="flex items-center gap-5 mb-8">
                      <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center text-slate-500 group-hover:text-blue-500 group-hover:bg-blue-500/10 transition-all border border-white/5">
                        <Users size={28} />
                      </div>
                      <div>
                        <h4 className="font-black text-white uppercase tracking-tighter text-lg">{member.username}</h4>
                        <p className="text-[10px] text-slate-500 font-mono italic lowercase">{member.email}</p>
                      </div>
                    </div>
                    <div className="flex justify-between items-center border-t border-white/5 pt-6">
                      <div className="flex items-center gap-2">
                         <ShieldCheck size={14} className="text-blue-500" />
                         <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{member.role}</span>
                      </div>
                      <button className="text-slate-700 hover:text-red-500 transition-colors p-2 bg-white/5 rounded-xl"><Trash2 size={16} /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* NOTIFICATIONS FEED VIEW */
        <div className="max-w-4xl space-y-4 animate-in slide-in-from-right-4 duration-500">
          {notifications.map(n => (
            <div key={n.id} className="p-8 bg-[#0a0a0a] border border-white/5 rounded-[32px] flex items-start gap-6 group hover:border-white/10 transition-colors">
              <div className={`p-4 rounded-2xl bg-white/5 border border-white/5 ${n.type === 'security' ? 'text-red-500' : 'text-blue-500'}`}>
                 {n.type === 'security' ? <ShieldAlert size={24}/> : <Activity size={24}/>}
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-black text-white uppercase italic tracking-tight">{n.title}</h4>
                  <span className="text-[10px] font-mono text-slate-600 uppercase font-bold">{n.time}</span>
                </div>
                <p className="text-slate-500 text-sm leading-relaxed mb-4">{n.body}</p>
                <button className="flex items-center gap-2 text-[10px] font-black text-blue-500 uppercase tracking-widest hover:text-white transition-colors">
                  Acknowledge Receipt <ArrowRight size={14}/>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* SYSTEM HEALTH FOOTER (SUPER ADMIN ONLY) */}
      {me?.role === 'super_admin' && (
        <div className="col-span-12 p-8 bg-white/[0.01] border border-white/5 rounded-[48px] mt-12">
          <h4 className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em] mb-6 flex items-center gap-3">
            <Activity size={14} className="text-green-500"/> Infrastructure Global Status
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <HealthItem label="API Gateway" status="v1.0.4 - STABLE" />
            <HealthItem label="PostgreSQL" status="CONNECTED (9ms)" />
            <HealthItem label="WebSocket" status="ACTIVE" />
            <HealthItem label="Redis Cache" status="READY" />
          </div>
        </div>
      )}
    </div>
  );
}

// Small helper component for health check
function HealthItem({ label, status }: { label: string, status: string }) {
  return (
    <div className="p-5 bg-black/40 rounded-[24px] border border-white/5">
      <p className="text-[9px] text-slate-500 uppercase font-black tracking-widest mb-1">{label}</p>
      <p className="text-white text-xs font-mono font-bold tracking-tight italic">{status}</p>
    </div>
  );
}