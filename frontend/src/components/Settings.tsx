import { useState, useEffect } from 'react';
import { Mail, Bell, ShieldAlert, Lock, Save, CheckCircle, Smartphone, Globe, ShieldCheck } from 'lucide-react';
import api from '../lib/api';

export default function Settings() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  
  // Müşterinin kendi tercihlerini tutan state
  const [config, setConfig] = useState({
    alert_email: '',
    enable_email_notifications: true,
    enable_in_app_notifications: true,
    min_severity_level: 'high', // low, medium, high, critical
    mfa_enabled: false
  });

  useEffect(() => {
    // Sayfa açıldığında kullanıcının mevcut ayarlarını çek
    api.get('/auth/me').then(res => {
      setConfig(prev => ({
        ...prev,
        alert_email: res.data.email // Varsayılan olarak kendi maili
      }));
    });
  }, []);

  const handleSave = async () => {
    setLoading(true);
    try {
      // Backend'de /users/settings gibi bir endpoint'e kaydedeceğiz
      await api.patch('/management/settings', config);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error("Settings Update Failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-[1000px] mx-auto p-8 animate-in fade-in duration-500 pb-20">
      
      {/* HEADER */}
      <div className="mb-12 border-b border-white/5 pb-8 flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-black italic tracking-tighter text-white uppercase">Platform Settings</h2>
          <p className="text-slate-500 text-[10px] uppercase tracking-[0.4em] mt-2 font-bold">Configure your security & notification relay</p>
        </div>
        <button 
          onClick={handleSave}
          disabled={loading}
          className="flex items-center gap-2 px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-[0_10px_20px_rgba(37,99,235,0.2)] disabled:opacity-50"
        >
          {success ? <><CheckCircle size={16}/> Saved</> : <><Save size={16}/> Save Changes</>}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* EMAIL CONFIGURATION */}
        <div className="p-8 bg-[#0a0a0a] border border-white/5 rounded-[40px] space-y-6">
          <div className="flex items-center gap-3 text-blue-500 mb-2">
            <Mail size={20} />
            <h3 className="font-black text-xs uppercase tracking-widest text-white">Email Relay</h3>
          </div>
          
          <div>
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Target Alert Email</label>
            <input 
              type="email" 
              value={config.alert_email}
              onChange={(e) => setConfig({...config, alert_email: e.target.value})}
              className="w-full bg-black border border-white/10 rounded-2xl py-4 px-5 text-white text-sm focus:border-blue-500/50 outline-none transition-all"
              placeholder="alerts@yourcompany.com"
            />
          </div>

          <div className="flex items-center justify-between py-2">
            <span className="text-xs text-slate-400 font-bold uppercase">Enable Email Alerts</span>
            <ToggleButton 
              active={config.enable_email_notifications} 
              onClick={() => setConfig({...config, enable_email_notifications: !config.enable_email_notifications})} 
            />
          </div>
        </div>

        {/* IN-APP NOTIFICATIONS */}
        <div className="p-8 bg-[#0a0a0a] border border-white/5 rounded-[40px] space-y-6">
          <div className="flex items-center gap-3 text-purple-500 mb-2">
            <Bell size={20} />
            <h3 className="font-black text-xs uppercase tracking-widest text-white">In-App Feed</h3>
          </div>

          <div className="flex items-center justify-between py-2">
            <span className="text-xs text-slate-400 font-bold uppercase">Live Dashboard Notifications</span>
            <ToggleButton 
              active={config.enable_in_app_notifications} 
              onClick={() => setConfig({...config, enable_in_app_notifications: !config.enable_in_app_notifications})} 
              color="bg-purple-600"
            />
          </div>

          <div>
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Min. Severity Filter</label>
            <select 
              value={config.min_severity_level}
              onChange={(e) => setConfig({...config, min_severity_level: e.target.value})}
              className="w-full bg-black border border-white/10 rounded-2xl py-4 px-5 text-white text-sm focus:border-blue-500/50 outline-none uppercase font-bold"
            >
              <option value="low">Low & Above</option>
              <option value="medium">Medium & Above</option>
              <option value="high">High & Above</option>
              <option value="critical">Critical Only</option>
            </select>
          </div>
        </div>

        {/* SECURITY SETTINGS */}
        <div className="col-span-1 md:col-span-2 p-8 bg-red-500/[0.02] border border-red-500/10 rounded-[40px] flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <div className="p-5 bg-red-500/10 rounded-[24px] text-red-500 shadow-[0_0_20px_rgba(239,68,68,0.1)]">
              <ShieldCheck size={32} />
            </div>
            <div>
              <h4 className="text-white font-black italic uppercase tracking-widest">Master Security Override</h4>
              <p className="text-xs text-slate-500 max-w-sm mt-1 uppercase leading-relaxed">Require Multi-Factor Authentication (MFA) for all SOC Analysts in your organization.</p>
            </div>
          </div>
          <button className="px-10 py-4 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black uppercase text-slate-400 hover:text-white hover:bg-white/10 transition-all cursor-not-allowed">
            Setup MFA (Coming Soon)
          </button>
        </div>

      </div>
    </div>
  );
}

// Custom Toggle Component
function ToggleButton({ active, onClick, color = "bg-blue-600" }: { active: boolean, onClick: () => void, color?: string }) {
  return (
    <button 
      onClick={onClick}
      className={`w-12 h-6 rounded-full transition-all flex items-center px-1 ${active ? color : 'bg-slate-800'}`}
    >
      <div className={`w-4 h-4 bg-white rounded-full transition-transform shadow-md ${active ? 'translate-x-6' : 'translate-x-0'}`} />
    </button>
  );
}