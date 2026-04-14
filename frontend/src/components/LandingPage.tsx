import { Shield, Lock, Activity, Terminal, ChevronRight, Globe } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#050505] text-slate-200 font-sans selection:bg-blue-500/30 overflow-hidden relative">
      
      {/* ARKAPLAN EFEKTLERİ */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-blue-500/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-red-500/5 blur-[150px] rounded-full pointer-events-none" />

      {/* HERO BÖLÜMÜ */}
      <main className="relative z-10 max-w-[1400px] mx-auto px-8 pt-32 pb-20 flex flex-col items-center text-center animate-in fade-in slide-in-from-bottom-8 duration-700">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold uppercase tracking-widest mb-8">
          <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
          Next-Gen Intrusion Detection
        </div>
        
        <h2 className="text-5xl md:text-7xl font-black text-white tracking-tight leading-tight mb-6">
          Secure Your Perimeter. <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-indigo-500 italic">
            Analyze In Real-Time.
          </span>
        </h2>
        
        <p className="text-lg text-slate-400 max-w-2xl mb-12">
          Enterprise-grade Web Intrusion Detection System. Monitor network traffic, detect anomalies, and mitigate threats with AI-driven analytics and zero-latency WebSocket feeds.
        </p>

        <div className="flex items-center gap-6">
          <button onClick={() => navigate('/register')} className="flex items-center gap-2 px-8 py-4 bg-white text-black hover:bg-slate-200 text-sm font-black uppercase tracking-wider rounded-xl transition-all">
            Deploy Now <ChevronRight size={18} />
          </button>
          <button onClick={() => navigate('/login')} className="flex items-center gap-2 px-8 py-4 bg-white/5 border border-white/10 hover:bg-white/10 text-white text-sm font-black uppercase tracking-wider rounded-xl transition-all">
            View Dashboard
          </button>
        </div>
      </main>

      {/* ÖZELLİKLER (FEATURES) */}
      <div className="relative z-10 max-w-[1400px] mx-auto px-8 py-20 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-8 bg-[#0a0a0a] border border-white/5 rounded-[32px] hover:border-white/10 transition-colors">
          <Activity className="text-blue-500 w-10 h-10 mb-6" />
          <h3 className="text-lg font-bold text-white mb-3">Real-Time Traffic</h3>
          <p className="text-sm text-slate-500 leading-relaxed">Zero-latency event streaming via secure WebSockets. See threats the millisecond they hit your servers.</p>
        </div>
        <div className="p-8 bg-[#0a0a0a] border border-white/5 rounded-[32px] hover:border-red-500/30 transition-colors group">
          <Lock className="text-slate-500 group-hover:text-red-500 w-10 h-10 mb-6 transition-colors" />
          <h3 className="text-lg font-bold text-white mb-3">Threat Classification</h3>
          <p className="text-sm text-slate-500 leading-relaxed">Automatic categorization of SQLi, XSS, DDoS, and Brute Force attacks with severity scoring.</p>
        </div>
        <div className="p-8 bg-[#0a0a0a] border border-white/5 rounded-[32px] hover:border-white/10 transition-colors">
          <Terminal className="text-slate-500 w-10 h-10 mb-6" />
          <h3 className="text-lg font-bold text-white mb-3">SOC Management</h3>
          <p className="text-sm text-slate-500 leading-relaxed">Dedicated portals for analysts and admins. Review, mitigate, and resolve incidents from a single pane of glass.</p>
        </div>
      </div>
      {/* FOOTER SECTION */}
      <footer className="relative z-10 border-t border-white/5 bg-black/50 py-12 mt-20">
        <div className="max-w-[1400px] mx-auto px-8 grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-3 mb-6">
              <Shield className="text-blue-500 w-6 h-6" />
              <h1 className="font-black italic text-lg uppercase tracking-tighter text-white">W-IDS CORE</h1>
            </div>
            <p className="text-slate-500 text-sm max-w-sm leading-relaxed">
              Next-generation web intrusion detection system providing real-time perimeter security and advanced threat analytics for enterprise networks.
            </p>
          </div>
          <div>
            <h4 className="text-white font-bold text-xs uppercase tracking-widest mb-6">Platform</h4>
            <ul className="space-y-4 text-sm text-slate-500">
              <li><button onClick={() => navigate('/login')} className="hover:text-blue-500 transition-colors">Dashboard</button></li>
              <li><button onClick={() => navigate('/register')} className="hover:text-blue-500 transition-colors">Security Nodes</button></li>
              <li><button className="hover:text-blue-500 transition-colors italic">API Documentation</button></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-bold text-xs uppercase tracking-widest mb-6">Support</h4>
            <ul className="space-y-4 text-sm text-slate-500">
              <li><button onClick={() => navigate('/contact')} className="hover:text-blue-500 transition-colors">Contact Engineering</button></li>
              <li><button className="hover:text-blue-500 transition-colors">System Status</button></li>
              <li><button className="hover:text-blue-500 transition-colors">Privacy Policy</button></li>
            </ul>
          </div>
        </div>
        <div className="max-w-[1400px] mx-auto px-8 pt-12 mt-12 border-t border-white/5 flex flex-col md:row justify-between items-center gap-4">
          <p className="text-[10px] text-slate-600 font-mono uppercase tracking-widest">© 2026 W-IDS CORE PLATFORM // ALL RIGHTS RESERVED.</p>
          <div className="flex gap-6 text-slate-600">
            <Globe size={14} className="hover:text-white cursor-pointer transition-colors" />
            <Terminal size={14} className="hover:text-white cursor-pointer transition-colors" />
          </div>
        </div>
      </footer>
    </div>

    
  );
}