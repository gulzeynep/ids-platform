import { useEffect, useState } from 'react';
import { Globe, ShieldAlert } from 'lucide-react';
import api from '../lib/api';

interface AnalysisStats {
  top_attackers: { ip: string; count: number }[];
  severity_distribution: Record<string, number>;
  protocol_distribution: Record<string, number>;
}

export default function Analysis() {
  const [stats, setStats] = useState<AnalysisStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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

    fetchAnalysisData();
  }, []);

  if (loading || !stats) {
    return (
      <div className="h-full w-full flex items-center justify-center p-20">
        <div className="w-8 h-8 border-2 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Calculate totals for percentages
  const totalSeverity = Object.values(stats.severity_distribution).reduce((a, b) => a + b, 0) || 1;
  const maxAttackerCount = stats.top_attackers.length > 0 ? stats.top_attackers[0].count : 1;

  return (
    <div className="max-w-[1400px] mx-auto p-6 animate-in fade-in duration-500">
      
      {/* HEADER */}
      <div className="mb-8 border-b border-white/5 pb-6">
        <h2 className="text-3xl font-black italic tracking-tighter text-purple-500 uppercase">Intelligence Lab</h2>
        <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em] mt-1">Deep Threat Analysis & Trends</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* TOP ATTACKERS (Threat Actors) */}
        <div className="bg-[#0a0a0a] border border-white/5 rounded-[32px] p-8">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-3 bg-purple-500/10 rounded-xl text-purple-500">
              <Globe size={20} />
            </div>
            <div>
              <h3 className="text-xl font-black italic text-white uppercase tracking-tight">Top Threat Actors</h3>
              <p className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.2em]">Highest frequency source IPs</p>
            </div>
          </div>

          <div className="space-y-5">
            {stats.top_attackers.map((hacker, index) => (
              <div key={index} className="relative">
                <div className="flex justify-between items-end mb-2">
                  <span className="text-sm font-bold font-mono text-blue-400">{hacker.ip}</span>
                  <span className="text-xs font-black text-slate-400">{hacker.count} Hits</span>
                </div>
                <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-purple-600 to-red-500 rounded-full"
                    style={{ width: `${(hacker.count / maxAttackerCount) * 100}%` }}
                  ></div>
                </div>
              </div>
            ))}
            {stats.top_attackers.length === 0 && (
              <p className="text-slate-500 text-xs italic text-center py-4">No threat actors detected yet.</p>
            )}
          </div>
        </div>

        {/* SEVERITY DISTRIBUTION */}
        <div className="bg-[#0a0a0a] border border-white/5 rounded-[32px] p-8">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-3 bg-red-500/10 rounded-xl text-red-500">
              <ShieldAlert size={20} />
            </div>
            <div>
              <h3 className="text-xl font-black italic text-white uppercase tracking-tight">Severity Distribution</h3>
              <p className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.2em]">Risk level breakdown</p>
            </div>
          </div>

          <div className="space-y-6">
            {['critical', 'high', 'medium', 'low'].map((sev) => {
              const count = stats.severity_distribution[sev] || 0;
              const percentage = Math.round((count / totalSeverity) * 100);
              
              let colorClass = 'bg-slate-500';
              if (sev === 'critical') colorClass = 'bg-red-500';
              if (sev === 'high') colorClass = 'bg-orange-500';
              if (sev === 'medium') colorClass = 'bg-yellow-500';
              if (sev === 'low') colorClass = 'bg-blue-500';

              return (
                <div key={sev} className="flex items-center gap-4">
                  <div className="w-20 text-right">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{sev}</span>
                  </div>
                  <div className="flex-1 h-3 bg-white/5 rounded-full overflow-hidden relative">
                    <div 
                      className={`h-full ${colorClass} rounded-full transition-all duration-1000`}
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                  <div className="w-12 text-left">
                    <span className="text-xs font-bold text-white">{percentage}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}