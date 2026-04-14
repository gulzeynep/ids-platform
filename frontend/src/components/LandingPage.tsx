import { Link } from 'react-router-dom';
import { Shield, Activity, Lock, Globe, ArrowRight, MousePointer2, Zap, BarChart3, ChevronLeft } from 'lucide-react';

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 selection:bg-blue-500/30 overflow-x-hidden">
      {/* GLOW EFFECT (Şov Parçası) */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-blue-600/10 blur-[120px] rounded-full -z-10"></div>

      <div className="container mx-auto px-6 relative">
        {/* NAV */}
        <nav className="flex items-center justify-between py-8">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-600/20">
              <Shield className="text-white w-6 h-6" />
            </div>
            <span className="text-xl font-bold text-white tracking-tight">W-IDS <span className="text-blue-500 text-xs font-mono">v1.0</span></span>
          </div>
          <div className="flex items-center gap-6">
            <Link to="/contact" className="text-sm font-medium hover:text-white transition-colors">Support</Link>
            <Link to="/login" className="bg-slate-900 border border-slate-800 text-white px-5 py-2 rounded-lg text-sm font-bold hover:bg-slate-800 transition-all">Operative Login</Link>
          </div>
        </nav>

        {/* HERO SECTION */}
        <div className="pt-20 pb-32 text-center max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 px-3 py-1 rounded-full text-blue-400 text-xs font-bold mb-6 animate-bounce">
            <Zap className="w-3 h-3" /> NEURAL ENGINE ACTIVE
          </div>
          <h1 className="text-6xl md:text-8xl font-extrabold text-white mb-8 leading-[1.1] tracking-tight">
            Stop Threats <br /> <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-600">Before They Strike.</span>
          </h1>
          <p className="text-xl text-slate-400 mb-10 max-w-2xl mx-auto">
            Autonomous L7 intrusion detection with real-time payload analysis. Built for the modern security operative.
          </p>
          <div className="flex justify-center gap-4">
            <Link to="/register" className="bg-blue-600 hover:bg-blue-700 text-white px-10 py-4 rounded-xl font-bold flex items-center gap-2 shadow-xl shadow-blue-600/20 transition-all hover:scale-105">
              Initialize System <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>

        {/* INFO CARDS (Bilgilendirme Kartları) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-32">
          {[
            { icon: Activity, title: "L7 Payload Analysis", desc: "Real-time inspection of HTTP/S traffic for SQLi, XSS, and RCE." },
            { icon: Globe, title: "Global Threat Map", desc: "Visualize attack origins with our integrated GeoIP neural tracking." },
            { icon: BarChart3, title: "Predictive Analytics", desc: "Identify patterns and prevent future breaches with AI-driven stats." }
          ].map((card, i) => (
            <div key={i} className="bg-slate-900/50 border border-slate-800 p-8 rounded-3xl hover:border-blue-500/50 transition-all group">
              <div className="w-12 h-12 bg-slate-800 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-blue-600 transition-colors">
                <card.icon className="text-blue-500 group-hover:text-white w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">{card.title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{card.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* FOOTER */}
      <footer className="border-t border-slate-900 bg-slate-950 py-12">
        <div className="container mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-2 opacity-50">
            <Shield className="w-5 h-5" />
            <span className="text-sm font-bold uppercase tracking-widest">W-IDS Project 2026</span>
          </div>
          <div className="flex gap-8 text-sm text-slate-500">
            <Link to="/contact" className="hover:text-white transition-colors">Contact</Link>
            <a href="#" className="hover:text-white transition-colors">Documentation</a>
            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;