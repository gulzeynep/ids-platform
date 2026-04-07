import { useEffect, useState, useCallback } from 'react';
import { AlertOctagon, X, Info, FileText, Globe, 
  Terminal, Clock, ShieldAlert, Building, ShieldCheck,
  FileEdit, Download } from 'lucide-react';
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
  const [selectedAlert, setSelectedAlert] = useState<any>(null); 
  const [note, setNote] = useState(""); 
  const [severityFilter, setSeverityFilter] = useState<'all' | 'critical' | 'high' | 'medium' | 'low'>('all');

  const fetchAlerts = useCallback(async () => {
    try {
      const res = await api.get(`/alerts?status=${activeTab}&severity=${severityFilter}`);
      setAlerts(res.data);
    } catch (error) {
      console.error("Intrusions fetch error:", error);
    }
  }, [activeTab, severityFilter]);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);
  
  const openDetail = async (id: number) => {
    try {
      const res = await api.get(`/alerts/${id}`);
      setSelectedAlert(res.data);
      setNote(res.data.notes || "");
    } catch (error) {
      console.error("Detail fetch error", error);
    }
  };

  const handleTriage = async (id: number, newStatus: string) => {
    try {
      await api.patch(`/alerts/${id}/triage`, {
        status: newStatus,
        notes: note
      });
      setSelectedAlert(null);
      fetchAlerts();
    } catch (error) {
      console.error("Triage update failed", error);
    }
  };


  return (
    <div className="max-w-[1200px] mx-auto p-6 animate-in fade-in duration-500">
      
      {/* --- HEADER & TAB CONTROL --- */}
      <div className="mb-8 border-b border-white/5 pb-6 flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-black italic tracking-tighter text-red-500 uppercase">Intrusion Management</h2>
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em] mt-1">Live Threat Triage & Mitigation</p>
        </div>

        <div className="flex flex-wrap items-center gap-4">
        {/* SEVERITY FILTER DROPDOWN */}
        <select 
          value={severityFilter}
          onChange={(e) => setSeverityFilter(e.target.value as any)}
          className="bg-[#0a0a0a] text-slate-300 text-[10px] font-black uppercase tracking-widest border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 cursor-pointer">
          <option value="all">All Severities</option>
          <option value="critical">Critical Only</option>
          <option value="high">High Risk</option>
          <option value="medium">Medium Risk</option>
          <option value="low">Low Risk</option>
        </select>
        </div>
        
        <div className="flex gap-2 bg-black/40 p-1.5 rounded-2xl border border-white/5 backdrop-blur-md">
          <button 
            onClick={() => setActiveTab('new')}
            className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
              activeTab === 'new' 
              ? 'bg-red-500/20 text-red-500 border border-red-500/20 shadow-[0_0_20px_rgba(239,68,68,0.1)]' 
              : 'text-slate-500 hover:text-white'
            }`}
          >
            Pending Analysis
          </button>
          <button 
            onClick={() => setActiveTab('reviewed')}
            className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
              activeTab === 'reviewed' 
              ? 'bg-green-500/20 text-green-500 border border-green-500/20 shadow-[0_0_20px_rgba(34,197,94,0.1)]' 
              : 'text-slate-500 hover:text-white'
            }`}
          >
            Resolved Archive
          </button>
        </div>
      </div>

      {/* --- ALERTS LIST --- */}
      <div className="grid gap-3">
        {alerts.map((alert) => (
          <div 
            key={alert.id} 
            onClick={() => openDetail(alert.id)}
            className="group p-5 bg-[#0a0a0a] border border-white/5 rounded-[24px] flex items-center justify-between hover:border-white/20 hover:bg-white/[0.02] transition-all cursor-pointer hover:translate-x-1"
          >
            <div className="flex items-center gap-5">
              <div className={`p-4 rounded-2xl transition-transform group-hover:scale-110 ${
                alert.severity === 'critical' ? 'bg-red-500/10 text-red-500' : 'bg-orange-500/10 text-orange-500'
              }`}>
                <AlertOctagon size={24} />
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h3 className="font-black text-white italic uppercase tracking-tight text-lg">{alert.type}</h3>
                  <span className={`text-[8px] font-black px-2 py-0.5 rounded border uppercase ${
                    alert.severity === 'critical' ? 'border-red-500/30 text-red-500' : 'border-orange-500/30 text-orange-500'
                  }`}>
                    {alert.severity}
                  </span>
                </div>
                <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-1.5 flex items-center gap-2">
                  Origin: <span className="text-blue-400 font-mono">{alert.source_ip}</span> 
                  <span className="text-white/10">|</span>
                  <Clock size={10}/> {new Date(alert.timestamp).toLocaleString()}
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
               <div className="text-right mr-4 hidden md:block">
                  <p className="text-[8px] text-slate-600 font-black uppercase tracking-widest">Status</p>
                  <p className={`text-[10px] font-bold uppercase ${alert.status === 'new' ? 'text-red-400' : 'text-green-400'}`}>
                    {alert.status === 'new' ? 'Unresolved' : 'Mitigated'}
                  </p>
               </div>
               <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-slate-500 group-hover:bg-blue-500/20 group-hover:text-blue-400 transition-all">
                  <Info size={16} />
               </div>
            </div>
          </div>
        ))}

        {alerts.length === 0 && (
          <div className="py-20 text-center border-2 border-dashed border-white/5 rounded-[40px]">
            <p className="text-slate-600 font-black uppercase tracking-[0.2em] italic text-sm">Sector Clear. No threats detected.</p>
          </div>
        )}
      </div>

      {/* --- INTELLIGENCE DETAIL MODAL (POPUP) --- */}
      {selectedAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/90 backdrop-blur-md animate-in fade-in zoom-in duration-300">
          <div className="bg-[#050505] border border-white/10 rounded-[40px] w-full max-w-3xl max-h-[90vh] overflow-hidden shadow-[0_0_100px_rgba(0,0,0,1)] flex flex-col">
            
            {/* Modal Header */}
            <div className="p-8 border-b border-white/5 flex justify-between items-center bg-white/[0.01]">
              <div className="flex items-center gap-4">
                <div className={`p-4 rounded-2xl ${selectedAlert.severity === 'critical' ? 'bg-red-500/20 text-red-500' : 'bg-orange-500/20 text-orange-500'}`}>
                  <ShieldAlert size={32} />
                </div>
                <div>
                  <h3 className="text-2xl font-black italic text-white uppercase tracking-tighter">{selectedAlert.type}</h3>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-[9px] text-slate-500 font-black uppercase tracking-widest">Incident ID: #{selectedAlert.id}</span>
                    <span className="w-1 h-1 bg-white/20 rounded-full"></span>
                    <span className="text-[9px] text-blue-500 font-black uppercase tracking-widest">Vector: {selectedAlert.protocol || 'HTTP/TCP'}</span>
                  </div>
                </div>
              </div>
              <button onClick={() => setSelectedAlert(null)} className="p-3 hover:bg-white/5 rounded-full text-slate-500 transition-colors">
                <X size={24}/>
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-8 overflow-y-auto custom-scrollbar flex-1 space-y-8">
              {/* Network Stats */}
              <div className="grid grid-cols-3 gap-4">
                <DetailBox label="Attacker IP" value={selectedAlert.source_ip} icon={<Globe size={12}/>} />
                <DetailBox label="Target Server" value={selectedAlert.destination_ip} icon={<Building size={12}/>} />
                <DetailBox label="Detected Action" value={selectedAlert.action || 'LOGGED'} icon={<ShieldCheck size={12}/>} />
              </div>

              {/* Payload Inspector */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <Terminal size={14} className="text-blue-500"/> Malicious Payload Inspector
                  </label>
                  <span className="text-[8px] bg-blue-500/10 text-blue-500 px-2 py-0.5 rounded font-black uppercase">UTF-8 Encoded</span>
                </div>
                <div className="relative group">
                  <pre className="p-6 bg-black border border-white/5 rounded-3xl text-xs font-mono text-blue-400/90 leading-relaxed overflow-x-auto shadow-inner">
                    {selectedAlert.payload_preview || "No raw payload data captured for this incident."}
                  </pre>
                  <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="p-2 bg-white/5 rounded-lg text-slate-400 hover:text-white"><FileText size={14}/></button>
                  </div>
                </div>
              </div>

              {/* Analyst Notebook */}
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <FileEdit size={14} className="text-orange-500"/> Analyst Investigation Notes
                </label>
                <textarea 
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Describe the threat context, remediation steps, or why this was flagged..."
                  className="w-full h-32 bg-white/[0.02] border border-white/5 rounded-[24px] p-5 text-sm text-slate-300 focus:outline-none focus:border-blue-500/40 transition-all placeholder:text-slate-700"
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-8 bg-white/[0.01] border-t border-white/5 flex justify-between items-center">
              <button className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-white transition-colors">
                <Download size={14}/> Export Intelligence Report
              </button>
              
              <div className="flex gap-4">
                <button 
                  onClick={() => handleTriage(selectedAlert.id, 'false_positive')}
                  className="px-8 py-3 bg-white/5 hover:bg-white/10 text-slate-400 text-[10px] font-black uppercase tracking-widest rounded-2xl transition-all"
                >
                  Mark False Positive
                </button>
                <button 
                  onClick={() => handleTriage(selectedAlert.id, 'reviewed')}
                  className="px-8 py-3 bg-green-500 text-black text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-green-400 transition-all shadow-[0_0_30px_rgba(34,197,94,0.2)]"
                >
                  Verify & Resolve
                </button>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}

// --- HELPER COMPONENT ---
function DetailBox({ label, value, icon }: { label: string, value: string, icon: any }) {
  return (
    <div className="p-5 bg-white/[0.02] border border-white/5 rounded-3xl group hover:border-white/10 transition-all">
      <div className="flex items-center gap-2 text-slate-500 mb-2">
        {icon}
        <span className="text-[8px] font-black uppercase tracking-widest">{label}</span>
      </div>
      <p className="text-sm font-bold text-white font-mono truncate">{value}</p>
    </div>
  );
}
