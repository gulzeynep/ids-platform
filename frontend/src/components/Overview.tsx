import { useEffect, useState, useMemo, useCallback } from 'react';
import { AlertTriangle, Activity, Database, Terminal, RefreshCcw, Globe, Shield } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import api from '../lib/api'; // API dosyanızın yolu

const COLORS = ['#3b82f6', '#ef4444', '#f59e0b', '#10b981', '#8b5cf6'];

interface Alert {
  id: number;
  type: string;
  severity: string;
  source_ip: string;
  destination_ip: string;
  timestamp: string;
  action: string;
}

interface DashboardStats {
  total_events: number;
  critical_threats: number;
  pending_reviews: number;
  network_status: string;
}

export default function Overview() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      // Backend'de yazdığımız yeni Dashboard Analytics API'si
      const statsRes = await api.get('/analytics/overview');
      setStats(statsRes.data);
      
      // Backend'deki Alarm listesi (En son 50 olayı getirir)
      const alertsRes = await api.get('/alerts/list');
      setAlerts(alertsRes.data.slice(0, 50)); 
      
      setLastUpdated(new Date());
    } catch (error) {
      console.error("Dashboard Sync Error:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    // NOT: Websocket bağlantısını bir sonraki adımda buraya ekleyeceğiz. Şimdilik 5 saniyede bir çekiyor.
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const chartData = useMemo(() => {
    const counts: Record<string, number> = {};
    alerts.forEach(a => { counts[a.type] = (counts[a.type] || 0) + 1; });
    return Object.keys(counts).map(k => ({ name: k, value: counts[k] }));
  }, [alerts]);

  return (
    <div className="max-w-[1600px] mx-auto p-6 grid grid-cols-12 gap-6 animate-in fade-in duration-500">
      
      {/* BAŞLIK VE SYNC BUTONU */}
      <div className="col-span-12 flex justify-between items-end mb-2 border-b border-white/5 pb-4">
        <div>
          <h2 className="text-2xl font-black italic tracking-tight">TRAFFIC & THREAT OVERVIEW</h2>
          <p className="text-slate-500 text-xs uppercase tracking-widest mt-1">Real-time Network Statistics & Connection Summary</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-[10px] text-slate-500 font-mono italic bg-white/5 px-3 py-1 rounded-full">
            SYNC: {lastUpdated.toLocaleTimeString()}
          </div>
          <button onClick={fetchData} className="p-2 bg-white/5 border border-white/10 rounded-xl text-slate-400 hover:text-white transition-colors">
            <RefreshCcw size={16} className={loading ? "animate-spin text-blue-500" : ""} />
          </button>
        </div>
      </div>

      {/* SOL TARAF - İSTATİSTİKLER VE GRAFİKLER */}
      <div className="col-span-12 lg:col-span-4 space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="p-6 bg-[#0a0a0a] border border-white/5 rounded-[32px] hover:border-blue-500/30 transition-colors">
            <div className="flex items-center justify-between mb-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">
              <span>Total Events</span>
              <Database size={14} className="text-blue-500" />
            </div>
            <p className="text-3xl font-black text-white">{stats?.total_events || 0}</p>
          </div>
          <div className={`p-6 border rounded-[32px] transition-all ${stats?.critical_threats ? "bg-red-500/5 border-red-500/30 shadow-[0_0_30px_rgba(239,68,68,0.1)]" : "bg-[#0a0a0a] border-white/5 hover:border-white/10"}`}>
            <div className="flex items-center justify-between mb-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">
              <span>Critical Threats</span>
              <AlertTriangle size={14} className={stats?.critical_threats ? "text-red-500" : "text-slate-500"} />
            </div>
            <p className={`text-3xl font-black ${stats?.critical_threats ? "text-red-500" : "text-white"}`}>{stats?.critical_threats || 0}</p>
          </div>
        </div>

        <div className="p-6 bg-[#0a0a0a] border border-white/5 rounded-[32px]">
          <div className="flex items-center gap-2 mb-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">
            <Activity size={14} className="text-blue-500" /> Intrusion Classification
          </div>
          <div className="h-[250px] w-full">
            {alerts.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={chartData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value" stroke="none">
                    {chartData.map((_, index) => (<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#000', border: '1px solid #222', borderRadius: '12px' }} />
                  <Legend iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-600 text-xs italic">Awaiting network traffic...</div>
            )}
          </div>
        </div>
        
        <div className="p-6 bg-[#0a0a0a] border border-white/5 rounded-[32px]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest">
              <Globe size={14} className={stats?.network_status === 'Secure' ? "text-green-500" : "text-red-500 animate-pulse"}/> 
              Global Status
            </div>
            <span className={`text-[10px] px-2 py-1 rounded font-black uppercase tracking-wider ${stats?.network_status === 'Secure' ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"}`}>
              {stats?.network_status || "Checking"}
            </span>
          </div>
        </div>
      </div>

      {/* SAĞ TARAF - OLAY AKIŞI (LIVE INTRUSION FEED) */}
      <div className="col-span-12 lg:col-span-8 bg-[#0a0a0a] border border-white/5 rounded-[32px] overflow-hidden flex flex-col h-[700px]">
        <div className="p-6 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Terminal size={14} className="text-slate-400"/>
            <h2 className="font-bold text-xs uppercase tracking-[0.3em] text-slate-400">Connection Summary & Live Feed</h2>
          </div>
        </div>
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left border-collapse">
            <thead className="bg-white/5 text-[10px] uppercase font-black text-slate-500 sticky top-0 backdrop-blur-md">
              <tr>
                <th className="px-6 py-4 italic">Time</th>
                <th className="px-6 py-4 italic">Action</th>
                <th className="px-6 py-4 italic">Initiator IP</th>
                <th className="px-6 py-4 italic">Responder IP</th>
                <th className="px-6 py-4 text-right italic">Priority</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {alerts.map((alert) => (
                <tr key={alert.id} className="group hover:bg-blue-500/[0.02] transition-colors">
                  <td className="px-6 py-4 text-[10px] font-mono text-slate-500 italic">
                    {new Date(alert.timestamp).toLocaleTimeString()}
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-bold text-white group-hover:text-blue-400 block">{alert.type}</span>
                    <span className="text-[9px] font-mono text-slate-500 uppercase block">{alert.action}</span>
                  </td>
                  <td className="px-6 py-4 font-mono text-xs text-slate-400">
                    {alert.source_ip}
                  </td>
                  <td className="px-6 py-4 font-mono text-xs text-slate-400">
                    {alert.destination_ip}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className={`px-2 py-1 rounded-md text-[9px] font-black uppercase border inline-block ${
                      alert.severity.toLowerCase() === 'critical' ? 'bg-red-500/10 text-red-500 border-red-500/20 shadow-[0_0_10px_rgba(239,68,68,0.2)]' : 
                      'bg-blue-500/10 text-blue-500 border-blue-500/20'
                    }`}>
                      {alert.severity}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {alerts.length === 0 && !loading && (
            <div className="p-20 text-center text-slate-600 italic text-xs uppercase tracking-widest flex flex-col items-center gap-3">
              <Shield size={32} className="opacity-20" />
              Perimeter Secure. No traffic detected.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}