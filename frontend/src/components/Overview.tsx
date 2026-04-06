import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Shield, Activity, AlertTriangle, Zap, Globe, 
  ArrowUpRight, Terminal, MousePointer2, Maximize2, X, 
  Fingerprint, ShieldCheck, Download, FileText, Clock
} from 'lucide-react';
import AttackMap from './AttackMap'; // Bu bileşenin ZoomableGroup içermesi şart
import api from '../lib/api';

export default function Overview() {
  const navigate = useNavigate();
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total_alerts: 0, critical_alerts: 0, avg_response: '0ms' });
  const [recentAlerts, setRecentAlerts] = useState<any[]>([]);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const res = await api.get('/analytics/overview');
        setStats(res.data);
        const alertsRes = await api.get('/alerts/list?limit=5');
        setRecentAlerts(alertsRes.data);
      } catch (err) {
        console.error("Dashboard data fetch error:", err);
        // Hata olsa bile demo verileriyle devam et (Siyah ekranı önlemek için)
        setRecentAlerts([
            { id: 1, type: 'SQL Injection', source_ip: '192.168.1.1', severity: 'critical' },
            { id: 2, type: 'Brute Force', source_ip: '45.33.2.1', severity: 'high' }
        ]);
      } finally {
        setLoading(false);
      }
    };
    loadDashboard();
  }, []);

  // Yükleme ekranı (Siyah ekranı engeller)
  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-[#050505]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.5em]">Syncing Intelligence...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1600px] mx-auto p-8 animate-in fade-in duration-700 space-y-8 pb-20">
      
      {/* HEADER */}
      <div className="flex justify-between items-end border-b border-white/5 pb-6">
        <div>
          <h2 className="text-2xl font-black italic text-white uppercase tracking-tighter">Threat Intelligence Center</h2>
          <p className="text-[10px] text-blue-500 font-bold uppercase tracking-[0.4em] mt-1">Real-time attack surface analysis</p>
        </div>
        <div className="flex gap-3">
           <button className="px-6 py-2 bg-white/5 hover:bg-white/10 text-slate-400 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-2">
              <Download size={14}/> Export Intelligence Report
           </button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-8">
        
        {/* --- SOL KOLON (ANALİZLER VE KONTROL) --- */}
        <div className="col-span-12 lg:col-span-3 space-y-6">
          <div className="space-y-3">
            <CompactStat title="Total Threats" value={stats.total_alerts || 1240} icon={<Shield size={16}/>} color="text-blue-500" onClick={() => navigate('/analysis')} />
            <CompactStat title="Critical Alerts" value={stats.critical_alerts || 12} icon={<AlertTriangle size={16}/>} color="text-red-500" onClick={() => navigate('/intrusions')} />
          </div>

          <div className="p-6 bg-[#0a0a0a] border border-white/5 rounded-[32px] space-y-4 shadow-xl">
             <h3 className="text-[9px] font-black text-slate-500 uppercase tracking-[0.3em] flex items-center gap-2"><Fingerprint size={14}/> Identity Analysis</h3>
             <div className="space-y-3">
                <ProgressItem label="Human" value="82%" color="bg-blue-500" />
                <ProgressItem label="Bots" value="18%" color="bg-green-500" />
             </div>
          </div>

          <div className="p-6 bg-[#0a0a0a] border border-white/5 rounded-[32px] shadow-xl">
             <h3 className="text-[9px] font-black text-slate-500 uppercase tracking-[0.3em] mb-4 flex items-center gap-2"><ShieldCheck size={14}/> Trust Perimeter</h3>
             <button className="w-full py-4 bg-blue-600/10 hover:bg-blue-600/20 text-blue-500 border border-blue-500/20 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all">
                Whitelist My IP
             </button>
          </div>
        </div>

        {/* --- ORTA KOLON (TRAFİK VE FEED) --- */}
        <div className="col-span-12 lg:col-span-6 space-y-6">
          {/* USER TRAFFIC GRAPH */}
          <div className="p-8 bg-[#0a0a0a] border border-white/5 rounded-[40px] shadow-2xl h-[280px] flex flex-col justify-between">
             <div className="flex justify-between items-center mb-4">
                <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] flex items-center gap-2"><Activity size={14}/> User Traffic</h3>
                <span className="text-[10px] font-mono text-blue-500">4.2k req/s</span>
             </div>
             <div className="flex items-end gap-1.5 h-24 justify-center">
                {[40, 70, 45, 90, 65, 80, 30, 95, 50, 75, 60, 85].map((h, i) => (
                  <div key={i} className="flex-1 bg-blue-500/5 rounded-t-lg relative group">
                    <div className="absolute bottom-0 w-full bg-blue-500/40 group-hover:bg-blue-500 transition-all rounded-t-lg" style={{ height: `${h}%` }}></div>
                  </div>
                ))}
             </div>
          </div>

          {/* LIVE ALARM FEED */}
          <div className="bg-[#0a0a0a] border border-white/5 rounded-[40px] p-8 shadow-2xl">
             <h3 className="text-sm font-black text-white uppercase italic tracking-tighter mb-6 flex items-center gap-3">Live Intercepts <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-ping"></span></h3>
             <div className="space-y-3">
                {recentAlerts?.map((alert: any) => (
                  <div key={alert.id} onClick={() => navigate('/intrusions')} className="p-4 bg-white/[0.01] border border-white/5 rounded-2xl flex justify-between items-center group hover:bg-white/5 transition-all cursor-pointer">
                     <div className="text-[10px] font-black text-white uppercase italic flex items-center gap-4">
                        <Shield size={14} className={alert.severity === 'critical' ? 'text-red-500' : 'text-slate-700 group-hover:text-blue-500'} />
                        {alert.type} Blocked from {alert.source_ip}
                     </div>
                     <ArrowUpRight size={14} className="text-slate-800 group-hover:text-white" />
                  </div>
                ))}
             </div>
          </div>
        </div>

        {/* --- SAĞ KOLON (HARİTA VE VEKTÖR) --- */}
        <div className="col-span-12 lg:col-span-3 space-y-6">
          <div className="p-6 bg-[#0a0a0a] border border-white/5 rounded-[32px] shadow-2xl">
            <h3 className="text-[9px] font-black text-slate-500 uppercase tracking-[0.3em] mb-6 flex items-center gap-2"><Terminal size={14}/> Attack Vectors</h3>
            <div className="space-y-5">
              <DistributionItem label="SQLi" value="45%" color="bg-blue-600" />
              <DistributionItem label="Brute Force" value="30%" color="bg-purple-600" />
              <DistributionItem label="DDoS" value="25%" color="bg-red-600" />
            </div>
          </div>

          {/* KÜÇÜK HARİTA WIDGETI (TIKLANINCA BÜYÜR) */}
          <div 
            onClick={() => setIsMapOpen(true)}
            className="bg-[#0a0a0a] border border-white/5 rounded-[32px] p-5 h-[220px] relative overflow-hidden group shadow-2xl cursor-pointer hover:border-blue-500/20 transition-all"
          >
            <div className="absolute top-4 left-5 z-10 pointer-events-none">
              <h4 className="text-white font-black italic uppercase tracking-tighter text-[10px]">Global Intel</h4>
              <p className="text-[8px] text-blue-500 font-black uppercase mt-1 flex items-center gap-1"><Maximize2 size={8}/> Expand View</p>
            </div>
            <div className="w-full h-full opacity-40 group-hover:opacity-100 transition-opacity pointer-events-none">
               <AttackMap attacks={[]} />
            </div>
          </div>

          <div className="p-6 bg-[#0a0a0a] border border-white/5 rounded-[32px]">
             <h3 className="text-[9px] font-black text-slate-500 uppercase tracking-[0.3em] mb-4 flex items-center gap-2"><Globe size={14} /> Adversary Origins</h3>
             <div className="space-y-3">
                <SourceItem country="Russia" count={241} color="text-red-500" />
                <SourceItem country="China" count={118} color="text-orange-500" />
             </div>
          </div>
        </div>

      </div>

      {/* HARİTA MODAL (BÜYÜTÜLMÜŞ HALİ) */}
      {isMapOpen && (
        <div className="fixed inset-0 z-[999] bg-black/95 backdrop-blur-2xl flex items-center justify-center p-12">
           <div className="w-full max-w-6xl h-[80vh] bg-[#050505] border border-white/10 rounded-[60px] p-10 relative shadow-2xl overflow-hidden">
              <button onClick={() => setIsMapOpen(false)} className="absolute top-10 right-10 p-4 text-slate-500 hover:text-white z-20 transition-all"><X size={32}/></button>
              <div className="w-full h-full"><AttackMap attacks={[]} /></div>
           </div>
        </div>
      )}
    </div>
  );
}

// --- YARDIMCI BİLEŞENLER ---

function CompactStat({ title, value, icon, color, onClick }: any) {
  return (
    <div onClick={onClick} className="p-4 bg-[#0a0a0a] border border-white/5 rounded-2xl flex items-center justify-between hover:border-white/20 transition-all cursor-pointer shadow-lg group">
       <div className="flex items-center gap-3">
          <div className={`p-2 bg-white/5 rounded-xl ${color} group-hover:scale-110 transition-transform`}>{icon}</div>
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{title}</span>
       </div>
       <span className="text-sm font-black text-white italic">{value}</span>
    </div>
  );
}

function ProgressItem({ label, value, color }: any) {
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-[8px] font-black uppercase text-slate-600"><span>{label}</span><span>{value}</span></div>
      <div className="h-1 bg-white/5 rounded-full overflow-hidden"><div className={`${color} h-full rounded-full`} style={{ width: value }}></div></div>
    </div>
  );
}

function DistributionItem({ label, value, color }: any) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-[8px] font-black uppercase text-slate-500"><span>{label}</span><span className="text-white italic font-mono">{value}</span></div>
      <div className="h-1 bg-white/5 rounded-full overflow-hidden"><div className={`${color} h-full rounded-full transition-all duration-1000`} style={{ width: value }}></div></div>
    </div>
  );
}

function SourceItem({ country, count, color }: any) {
  return (
    <div className="flex justify-between items-center px-1">
      <p className="text-[10px] font-black text-white uppercase italic">{country}</p>
      <p className={`text-[10px] font-black ${color}`}>{count}</p>
    </div>
  );
}