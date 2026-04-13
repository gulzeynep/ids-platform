import { useEffect, useState } from 'react';
import { Globe, ShieldAlert, ShieldCheck, Zap, BarChart3 } from 'lucide-react';
import api, { blacklistIP } from '../lib/api';

interface AnalysisStats {
  top_attackers: { ip: string; count: number }[];
  severity_distribution: Record<string, number>;
  protocol_distribution: Record<string, number>;
  total_automated_drops?: number; // Gelecek özellik için hazırlık
}

export default function Analysis() {
  const [stats, setStats] = useState<AnalysisStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [blockingIp, setBlockingIp] = useState<string | null>(null);

  const fetchAnalysisData = async () => {
    try {
      const res = await api.get('/alerts/stats/analysis');
      setStats(res.data);
    } catch (error) {
      console.error("Failed to fetch analysis data", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalysisData();
  }, []);

  const handleBlockIP = async (ip: string) => {
    if (!window.confirm(`Are you sure you want to BLACKLIST ${ip}?`)) return;
    
    setBlockingIp(ip);
    try {
      await blacklistIP(ip, "Manual Intelligence Block");
      alert(`${ip} has been neutralized in Redis & DB.`);
      fetchAnalysisData(); // Listeyi güncelle
    } catch (err) {
      alert("Failed to block IP. Check admin permissions.");
    } finally {
      setBlockingIp(null);
    }
  };

  if (loading || !stats) {
    return (
      <div className="h-full w-full flex items-center justify-center p-20">
        <div className="w-8 h-8 border-2 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  const totalSeverity = Object.values(stats.severity_distribution).reduce((a, b) => a + b, 0) || 1;
  const maxAttackerCount = stats.top_attackers.length > 0 ? stats.top_attackers[0].count : 1;

  return (
    <div className="max-w-[1400px] mx-auto p-6 animate-in fade-in duration-500">
      
      {/* HEADER & TOP METRICS */}
      <div className="mb-12 border-b border-white/5 pb-8 flex justify-between items-end">
        <div>
          <h2 className="text-4xl font-black italic tracking-tighter text-purple-500 uppercase">Intelligence Lab</h2>
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em] mt-1">Real-time Threat Neutralization Center</p>
        </div>
        
        {/* QUICK STAT CARDS */}
        <div className="flex gap-4">
          <div className="bg-emerald-500/5 border border-emerald-500/20 px-4 py-2 rounded-2xl flex items-center gap-3">
            <Zap className="text-emerald-500 w-4 h-4" />
            <div>
              <p className="text-[8px] font-black text-emerald-500/60 uppercase">Auto Drops</p>
              <p className="text-sm font-mono font-bold text-emerald-400">{stats.total_automated_drops || 0}</p>
            </div>
          </div>
          <div className="bg-purple-500/5 border border-purple-500/20 px-4 py-2 rounded-2xl flex items-center gap-3">
            <ShieldCheck className="text-purple-500 w-4 h-4" />
            <div>
              <p className="text-[8px] font-black text-purple-500/60 uppercase">Active Bans</p>
              <p className="text-sm font-mono font-bold text-purple-400">12</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* TOP THREAT ACTORS */}
        <div className="bg-[#0a0a0a] border border-white/5 rounded-[32px] p-8 shadow-2xl">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-500/10 rounded-xl text-blue-500">
                <Globe size={20} />
              </div>
              <div>
                <h3 className="text-xl font-black italic text-white uppercase tracking-tight">Active Adversaries</h3>
                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.2em]">Highest frequency source IPs</p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {stats.top_attackers.map((hacker, index) => (
              <div key={index} className="group p-4 bg-white/[0.02] border border-white/5 rounded-2xl hover:border-red-500/30 transition-all duration-300">
                <div className="flex justify-between items-center mb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-bold font-mono text-white">{hacker.ip}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/10 text-red-500 font-black uppercase tracking-widest">Targeting</span>
                  </div>
                  
                  <button 
                    onClick={() => handleBlockIP(hacker.ip)}
                    disabled={blockingIp === hacker.ip}
                    className={`p-2.5 rounded-xl transition-all ${
                      blockingIp === hacker.ip ? 'bg-slate-800' : 'bg-red-500/10 hover:bg-red-600 text-red-500 hover:text-white'
                    }`}
                  >
                    {blockingIp === hacker.ip ? (
                      <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    ) : (
                      <ShieldAlert size={18} />
                    )}
                  </button>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-blue-600 to-red-500 rounded-full"
                      style={{ width: `${(hacker.count / maxAttackerCount) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-xs font-mono font-bold text-slate-400 whitespace-nowrap">{hacker.count} Attacks</span>
                </div>
              </div>
            ))}
            
            {stats.top_attackers.length === 0 && (
              <p className="text-slate-500 text-xs italic text-center py-4">No active threat actors detected.</p>
            )}
          </div>
        </div>

        {/* RISK & PROTOCOL DISTRIBUTION */}
        <div className="space-y-8">
          
          {/* SEVERITY CARD */}
          <div className="bg-[#0a0a0a] border border-white/5 rounded-[32px] p-8">
            <div className="flex items-center gap-3 mb-8">
              <div className="p-3 bg-red-500/10 rounded-xl text-red-500">
                <BarChart3 size={20} />
              </div>
              <div>
                <h3 className="text-xl font-black italic text-white uppercase tracking-tight">Risk Stratification</h3>
                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.2em]">Live Severity Breakdown</p>
              </div>
            </div>

            <div className="space-y-6">
              {['critical', 'high', 'medium', 'low'].map((sev) => {
                const count = stats.severity_distribution[sev] || 0;
                const percentage = Math.round((count / totalSeverity) * 100);
                
                let colorClass = 'bg-slate-500';
                if (sev === 'critical') colorClass = 'bg-red-600 shadow-[0_0_15px_rgba(220,38,38,0.3)]';
                if (sev === 'high') colorClass = 'bg-orange-500';
                if (sev === 'medium') colorClass = 'bg-yellow-500';
                if (sev === 'low') colorClass = 'bg-blue-500';

                return (
                  <div key={sev} className="group">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 group-hover:text-white transition-colors">{sev}</span>
                      <span className="text-xs font-mono font-bold text-slate-300">{count} Events</span>
                    </div>
                    <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${colorClass} rounded-full transition-all duration-1000`}
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* PROTOCOL CARD */}
          <div className="bg-gradient-to-br from-purple-500/10 to-blue-500/10 border border-white/5 rounded-[32px] p-8">
            <h4 className="text-xs font-black uppercase tracking-[0.3em] text-slate-400 mb-6">Protocol Vector Analysis</h4>
            <div className="flex gap-2 flex-wrap">
              {Object.entries(stats.protocol_distribution).map(([proto, count]) => (
                <div key={proto} className="px-4 py-2 bg-black/40 border border-white/5 rounded-xl">
                  <p className="text-[8px] font-black text-slate-500 uppercase">{proto}</p>
                  <p className="text-lg font-mono font-bold text-blue-400">{count}</p>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}