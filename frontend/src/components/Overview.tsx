import { useEffect, useState, useCallback } from 'react';
import { Activity, ShieldAlert, Crosshair, Server, AlertOctagon, Clock } from 'lucide-react';
import api from '../lib/api';

// --- INTERFACES ---
interface DashboardStats {
  active_alerts: number;
  critical_threats: number;
  resolved_alerts: number;
  active_sensors: number;
}

interface Alert {
  id: number;
  type: string;
  severity: string;
  source_ip: string;
  status: string;
  timestamp: string;
}

export default function Overview() {
  const [stats, setStats] = useState<DashboardStats>({
    active_alerts: 0,
    critical_threats: 0,
    resolved_alerts: 0,
    active_sensors: 0
  });
  
  const [recentAlerts, setRecentAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);

  // --- FETCH DATA ---
  const fetchDashboardData = useCallback(async () => {
    try {
      // 1. Fetch Top-Level Statistics
      const statsRes = await api.get('/alerts/stats/overview');
      setStats(statsRes.data);

      // 2. Fetch Recent Live Threats (Status = new)
      const alertsRes = await api.get('/alerts?status=new');
      // Only take the 5 most recent for the overview feed
      setRecentAlerts(alertsRes.data.slice(0, 5));
    } catch (error) {
      console.error("Dashboard telemetry failed:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
    
    // Polling: Refresh dashboard every 5 seconds for real-time feel
    const interval = setInterval(fetchDashboardData, 5000);
    return () => clearInterval(interval);
  }, [fetchDashboardData]);

  if (loading) {
    return (
      <div className="h-full w-full flex items-center justify-center p-20">
        <div className="w-8 h-8 border-2 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-[1400px] mx-auto p-6 animate-in fade-in duration-500">
      
      {/* --- HEADER --- */}
      <div className="mb-8">
        <h2 className="text-3xl font-black italic tracking-tighter text-blue-500 uppercase">Command Center</h2>
        <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em] mt-1">Live Workspace Telemetry</p>
      </div>

      {/* --- STATS GRID --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        
        {/* Total Active Alerts */}
        <div className="bg-[#0a0a0a] border border-white/5 rounded-3xl p-6 relative overflow-hidden group hover:border-blue-500/30 transition-all shadow-lg">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-blue-500/10 rounded-2xl text-blue-500 group-hover:scale-110 transition-transform">
              <Activity size={24} />
            </div>
            <span className="text-[9px] font-black text-blue-500 uppercase tracking-widest bg-blue-500/10 px-2 py-1 rounded-md animate-pulse">Live</span>
          </div>
          <div>
            <p className="text-4xl font-black text-white">{stats.active_alerts}</p>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Pending Alerts</p>
          </div>
        </div>

        {/* Critical Threats */}
        <div className="bg-[#0a0a0a] border border-white/5 rounded-3xl p-6 relative overflow-hidden group hover:border-red-500/30 transition-all shadow-[0_0_20px_rgba(239,68,68,0.05)] hover:shadow-[0_0_30px_rgba(239,68,68,0.1)]">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-red-500/10 rounded-2xl text-red-500 group-hover:scale-110 transition-transform">
              <ShieldAlert size={24} />
            </div>
          </div>
          <div>
            <p className="text-4xl font-black text-red-500">{stats.critical_threats}</p>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Critical Threats</p>
          </div>
        </div>

        {/* Resolved Alerts */}
        <div className="bg-[#0a0a0a] border border-white/5 rounded-3xl p-6 relative overflow-hidden group hover:border-green-500/30 transition-all shadow-lg">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-green-500/10 rounded-2xl text-green-500 group-hover:scale-110 transition-transform">
              <Crosshair size={24} />
            </div>
          </div>
          <div>
            <p className="text-4xl font-black text-white">{stats.resolved_alerts}</p>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Mitigated Attacks</p>
          </div>
        </div>

        {/* Active Sensors */}
        <div className="bg-[#0a0a0a] border border-white/5 rounded-3xl p-6 relative overflow-hidden group hover:border-white/10 transition-all shadow-lg">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-white/5 rounded-2xl text-slate-400 group-hover:scale-110 transition-transform">
              <Server size={24} />
            </div>
            <div className="flex gap-1 mt-2">
              <span className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,1)]"></span>
            </div>
          </div>
          <div>
            <p className="text-4xl font-black text-white">{stats.active_sensors}</p>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Connected Sensors</p>
          </div>
        </div>

      </div>

      {/* --- LIVE THREAT FEED (Replaces Identity Analysis/Fake Data) --- */}
      <div className="bg-[#0a0a0a] border border-white/5 rounded-[32px] p-8">
        <div className="flex justify-between items-end mb-6 border-b border-white/5 pb-4">
          <div>
            <h3 className="text-xl font-black italic text-white uppercase tracking-tight">Recent Intrusions</h3>
            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.2em] mt-1">Latest intercepted payloads</p>
          </div>
          <button className="text-[10px] font-black text-blue-500 uppercase tracking-widest hover:text-blue-400 transition-colors">
            View All in Intrusion Tab &rarr;
          </button>
        </div>

        <div className="space-y-3">
          {recentAlerts.map((alert) => (
            <div key={alert.id} className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl flex items-center justify-between hover:border-white/10 transition-colors">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-xl ${alert.severity === 'critical' ? 'bg-red-500/10 text-red-500' : 'bg-orange-500/10 text-orange-500'}`}>
                  <AlertOctagon size={18} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">{alert.type}</h4>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-blue-400 text-[10px] font-mono">{alert.source_ip}</span>
                    <span className="text-slate-600">|</span>
                    <span className="text-[9px] text-slate-500 font-black uppercase tracking-widest flex items-center gap-1">
                      <Clock size={10} /> {new Date(alert.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              </div>
              <span className={`text-[8px] font-black uppercase tracking-widest px-3 py-1 rounded-md border ${
                alert.severity === 'critical' ? 'border-red-500/30 text-red-500 bg-red-500/5' : 'border-orange-500/30 text-orange-500 bg-orange-500/5'
              }`}>
                {alert.severity}
              </span>
            </div>
          ))}

          {recentAlerts.length === 0 && (
            <div className="py-12 text-center border-2 border-dashed border-white/5 rounded-[24px]">
              <p className="text-slate-500 font-black uppercase tracking-[0.2em] italic text-sm">System Secure. No recent intrusions.</p>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}