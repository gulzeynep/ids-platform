import { useEffect, useState, useCallback } from 'react';
import { AlertOctagon, CheckCircle2 } from 'lucide-react';
import api from '../lib/api';

interface Alert {
  id: number;
  type: string;
  severity: string;
  source_ip: string;
  status: string;
  timestamp: string;
}

export default function Intrusions() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [activeTab, setActiveTab] = useState<'new' | 'reviewed'>('new');

  const fetchAlerts = useCallback(async () => {
    try {
      const res = await api.get(`/alerts/list?status=${activeTab}`);
      setAlerts(res.data);
    } catch (error) {
      console.error("Intrusions fetch error:", error);
    }
  }, [activeTab]);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  const updateStatus = async (id: number, newStatus: string) => {
    try {
      await api.patch(`/alerts/${id}/status`, { status: newStatus });
      fetchAlerts(); // Listeyi yenile
    } catch (error) {
      console.error("Update failed", error);
    }
  };

  return (
    <div className="animate-in fade-in duration-500 max-w-[1200px] mx-auto p-6">
      <div className="mb-6 border-b border-white/5 pb-4 flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-black italic tracking-tight text-red-500">INTRUSION MANAGEMENT</h2>
          <p className="text-slate-500 text-xs uppercase tracking-widest mt-1">Review and mitigate threats</p>
        </div>
        <div className="flex gap-2 bg-[#0a0a0a] p-1 rounded-xl border border-white/5">
          <button 
            onClick={() => setActiveTab('new')}
            className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${activeTab === 'new' ? 'bg-red-500/20 text-red-500' : 'text-slate-500 hover:text-white'}`}
          >
            Pending Review
          </button>
          <button 
            onClick={() => setActiveTab('reviewed')}
            className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${activeTab === 'reviewed' ? 'bg-green-500/20 text-green-500' : 'text-slate-500 hover:text-white'}`}
          >
            Resolved
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {alerts.map((alert) => (
          <div key={alert.id} className="p-4 bg-[#0a0a0a] border border-white/5 rounded-2xl flex items-center justify-between hover:border-white/10 transition-colors">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-xl ${alert.severity === 'critical' ? 'bg-red-500/10 text-red-500' : 'bg-orange-500/10 text-orange-500'}`}>
                <AlertOctagon size={20} />
              </div>
              <div>
                <h3 className="font-bold text-white">{alert.type}</h3>
                <div className="text-xs text-slate-400 font-mono mt-1">
                  Targeted by: <span className="text-blue-400">{alert.source_ip}</span> | {new Date(alert.timestamp).toLocaleString()}
                </div>
              </div>
            </div>
            
            {activeTab === 'new' && (
              <div className="flex gap-2">
                <button 
                  onClick={() => updateStatus(alert.id, 'reviewed')}
                  className="flex items-center gap-2 px-3 py-2 bg-green-500/10 hover:bg-green-500/20 text-green-500 border border-green-500/20 rounded-lg text-[10px] font-black uppercase transition-all"
                >
                  <CheckCircle2 size={14} /> Mark as Reviewed
                </button>
                <button 
                  onClick={() => updateStatus(alert.id, 'false_positive')}
                  className="px-3 py-2 bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 rounded-lg text-[10px] font-black uppercase transition-all"
                >
                  False Positive
                </button>
              </div>
            )}
            {activeTab === 'reviewed' && (
              <span className="text-green-500 text-[10px] font-black uppercase tracking-wider px-3 py-1 bg-green-500/10 rounded-md">
                ✓ Reviewed
              </span>
            )}
          </div>
        ))}
        {alerts.length === 0 && (
          <div className="p-10 text-center text-slate-500 text-xs italic">No alerts in this category.</div>
        )}
      </div>
    </div>
  );
}