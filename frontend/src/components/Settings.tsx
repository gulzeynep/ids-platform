import { ShieldCheck, Mail, Lock, Sliders } from 'lucide-react';

export default function Settings() {
  return (
    <div className="max-w-[1000px] mx-auto p-8 animate-in fade-in duration-500">
      <h2 className="text-3xl font-black italic text-white uppercase tracking-tighter mb-10 border-b border-white/5 pb-6 flex items-center gap-4">
        <Sliders className="text-blue-500" /> Platform Configuration
      </h2>

      <div className="grid gap-8">
        {/* EMAIL SETTINGS */}
        <div className="p-8 bg-[#0a0a0a] border border-white/5 rounded-[40px]">
          <div className="flex items-center gap-3 mb-6">
            <Mail className="text-slate-500" size={20} />
            <h3 className="font-bold text-sm uppercase tracking-widest text-white">Alert Destinations</h3>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
              <div>
                <p className="text-xs font-bold text-white uppercase">Primary SOC Email</p>
                <p className="text-[10px] text-slate-500 font-mono">ops@wids-core.io</p>
              </div>
              <button className="text-[10px] font-black text-blue-500 uppercase underline">Change</button>
            </div>
          </div>
        </div>

        {/* SECURITY SETTINGS */}
        <div className="p-8 bg-[#0a0a0a] border border-white/5 rounded-[40px]">
          <div className="flex items-center gap-3 mb-6 text-red-500">
            <Lock size={20} />
            <h3 className="font-bold text-sm uppercase tracking-widest text-white">Advanced Security</h3>
          </div>
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-400">Force Multi-Factor Authentication (MFA)</p>
            <div className="w-10 h-5 bg-slate-800 rounded-full cursor-not-allowed"></div>
          </div>
        </div>
      </div>
    </div>
  );
}