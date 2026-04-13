import { Link } from 'react-router-dom';
import { Shield, Activity, Lock, Globe, ArrowRight } from 'lucide-react';

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 selection:bg-blue-500/30">
      {/* HERO SECTION */}
      <div className="relative overflow-hidden pt-16 pb-32">
        <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]"></div>
        <div className="container mx-auto px-6 relative">
          <nav className="flex items-center justify-between mb-24">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <Shield className="text-white w-6 h-6" />
              </div>
              <span className="text-xl font-bold text-white tracking-tight">W-IDS <span className="text-blue-500">CORE</span></span>
            </div>
            <div className="flex items-center gap-6">
              <Link to="/login" className="text-sm font-medium hover:text-white transition-colors">Operative Login</Link>
              <Link to="/register" className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg text-sm font-bold transition-all shadow-lg shadow-blue-500/20">Initialize Account</Link>
            </div>
          </nav>

          <div className="max-w-3xl">
            <h1 className="text-5xl md:text-7xl font-extrabold text-white mb-8 leading-tight">
              Next-Gen <span className="text-blue-500">Intrusion</span> Detection Systems.
            </h1>
            <p className="text-xl text-slate-400 mb-10 leading-relaxed">
              Autonomous threat intelligence and real-time network monitoring. 
              Protect your digital workspace with neural-link security analysis.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link to="/register" className="bg-white text-slate-950 px-8 py-4 rounded-xl font-bold flex items-center gap-2 hover:bg-blue-50 transition-all">
                Get Started <ArrowRight className="w-5 h-5" />
              </Link>
              <Link to="/contact" className="bg-slate-900 border border-slate-800 text-white px-8 py-4 rounded-xl font-bold hover:bg-slate-800 transition-all">
                Request Demo
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;