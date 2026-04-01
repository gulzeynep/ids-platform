import { Shield, Zap, Lock, BarChart3, ChevronRight, Globe } from 'lucide-react';

interface LandingProps {
  onGetStarted: () => void;
  onLoginClick: () => void;
  onContactClick: () => void;
}

export default function LandingPage({ onGetStarted, onLoginClick, onContactClick }: LandingProps) {
  return (
    <div className="bg-[#050505] text-white min-h-screen selection:bg-blue-500/30 overflow-x-hidden">
      {/* Navigation */}
      <nav className="p-6 flex justify-between items-center max-w-7xl mx-auto border-b border-white/5 bg-black/20 backdrop-blur-sm sticky top-0 z-50">
        <div className="flex items-center gap-2 font-bold text-xl tracking-tighter">
          <Shield className="text-blue-500 w-6 h-6" /> 
          <span className="bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">W-IDS</span>
        </div>
        <div className="flex items-center gap-8">
          <button onClick={onContactClick} className="hidden md:block text-slate-400 hover:text-white text-xs font-bold uppercase tracking-widest transition-colors">
            Contact Support
          </button>
          <button 
            onClick={onLoginClick} 
            className="bg-blue-600 text-white px-6 py-2 rounded-full font-bold text-sm hover:bg-blue-500 hover:scale-105 transition-all shadow-lg shadow-blue-600/20 active:scale-95"
            >
            Launch Console
            </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6 text-center relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-blue-600/10 blur-[120px] rounded-full -z-10" />
        <h1 className="text-6xl md:text-8xl font-black tracking-tighter mb-8 bg-gradient-to-b from-white to-white/30 bg-clip-text text-transparent leading-tight">
          NEXT-GEN <br /> NETWORK DEFENSE
        </h1>
        <p className="max-w-2xl mx-auto text-slate-400 text-lg mb-12 leading-relaxed">
          Real-time intrusion detection powered by advanced analytics. Monitor, detect, and neutralize threats before they reach your core infrastructure.
        </p>
        <div className="flex justify-center gap-4">
          <button 
            onClick={onGetStarted} 
            className="group bg-blue-600 px-8 py-5 rounded-2xl font-bold flex items-center gap-3 hover:bg-blue-500 transition-all shadow-xl shadow-blue-600/20"
          >
            Get Started Free <ChevronRight className="group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </section>

      {/* Features Grid */}
      <section className="max-w-7xl mx-auto grid md:grid-cols-3 gap-8 px-6 py-20">
        <FeatureCard 
          icon={<Zap className="text-yellow-500" />} 
          title="Sub-ms Analysis" 
          desc="Sub-millisecond alert processing using FastAPI and high-speed asynchronous streams." 
        />
        <FeatureCard 
          icon={<BarChart3 className="text-blue-500" />} 
          title="Live Dashboard" 
          desc="Visualize attack patterns instantly with our integrated Recharts monitoring suite." 
        />
        <FeatureCard 
          icon={<Lock className="text-green-500" />} 
          title="JWT Auth" 
          desc="Industry standard authentication for every sensor node and operator terminal." 
        />
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-12 px-6 bg-black/40">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6 text-slate-500 text-xs font-mono uppercase tracking-widest">
          <div className="flex items-center gap-2">
            <Globe size={14} /> Global Threat Network Status: <span className="text-green-500">Active</span>
          </div>
          <p>© 2026 W-IDS Tactical Operations. No Rights Reserved.</p>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) {
  return (
    <div className="p-8 bg-[#0a0a0a] border border-white/5 rounded-[32px] hover:border-blue-500/30 transition-all group">
      <div className="mb-6 p-3 bg-white/5 w-fit rounded-2xl group-hover:bg-blue-500/10 transition-colors">{icon}</div>
      <h3 className="text-xl font-bold mb-3 text-white">{title}</h3>
      <p className="text-slate-500 text-sm leading-relaxed">{desc}</p>
    </div>
  );
}