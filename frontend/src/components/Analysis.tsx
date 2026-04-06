import { useEffect, useState, useCallback } from 'react';
import { Search, Filter, Terminal, ShieldAlert } from 'lucide-react';
import api from '../lib/api';

interface Alert {
  id: number;
  type: string;
  severity: string;
  source_ip: string;
  destination_ip: string;
  source_port: number | null;
  destination_port: number | null;
  protocol: string;
  action: string;
  timestamp: string;
}

export default function Analysis() {
  const [events, setEvents] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/alerts/list');
      setEvents(res.data);
    } catch (error) {
      console.error("Analysis data fetch error:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  return (
    <div className="animate-in fade-in duration-500 max-w-[1600px] mx-auto p-6">
      <div className="mb-6 border-b border-white/5 pb-4 flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-black italic tracking-tight">CONNECTION ANALYSIS</h2>
          <p className="text-slate-500 text-xs uppercase tracking-widest mt-1">Deep packet inspection & event logs</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-xs font-bold uppercase tracking-wider text-slate-300 transition-colors">
            <Filter size={14} /> Filter
          </button>
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input 
              type="text" 
              placeholder="Search IP, Port or Event..." 
              className="pl-9 pr-4 py-2 bg-[#0a0a0a] border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500/50 w-64"
            />
          </div>
        </div>
      </div>

      <div className="bg-[#0a0a0a] border border-white/5 rounded-[32px] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-white/5 text-[10px] uppercase font-black text-slate-500">
              <tr>
                <th className="px-6 py-4">Timestamp</th>
                <th className="px-6 py-4">Action / Event</th>
                <th className="px-6 py-4">Initiator (Source)</th>
                <th className="px-6 py-4">Responder (Target)</th>
                <th className="px-6 py-4">Protocol</th>
                <th className="px-6 py-4 text-right">Priority</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {events.map((ev) => (
                <tr key={ev.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-6 py-4 text-[10px] font-mono text-slate-500">
                    {new Date(ev.timestamp).toLocaleString()}
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-bold text-white block">{ev.type}</span>
                    <span className="text-[9px] font-mono text-slate-500 uppercase tracking-wider">{ev.action}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-mono text-xs text-blue-400 block">{ev.source_ip}</span>
                    <span className="text-[9px] text-slate-500">Port: {ev.source_port || 'N/A'}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-mono text-xs text-slate-300 block">{ev.destination_ip}</span>
                    <span className="text-[9px] text-slate-500">Port: {ev.destination_port || 'N/A'}</span>
                  </td>
                  <td className="px-6 py-4 font-mono text-[10px] text-slate-400">
                    {ev.protocol}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className={`px-2 py-1 rounded text-[9px] font-black uppercase border inline-block ${
                      ev.severity.toLowerCase() === 'critical' ? 'bg-red-500/10 text-red-500 border-red-500/20' : 
                      ev.severity.toLowerCase() === 'high' ? 'bg-orange-500/10 text-orange-500 border-orange-500/20' :
                      'bg-blue-500/10 text-blue-500 border-blue-500/20'
                    }`}>
                      {ev.severity}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {events.length === 0 && !loading && (
            <div className="p-10 text-center text-slate-600 text-xs uppercase tracking-widest">No events recorded.</div>
          )}
        </div>
      </div>
    </div>
  );
}