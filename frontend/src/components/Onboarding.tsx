import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building, User, Target, Loader2, CheckCircle2, Briefcase, GraduationCap, Code, TestTube, Edit3 } from 'lucide-react';
import api from '../lib/api';

export default function Onboarding() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  
  // UI States
  const [hasCompany, setHasCompany] = useState(true);
  const [soloRole, setSoloRole] = useState('student'); // default solo role
  const [customRole, setCustomRole] = useState('');
  const [workspaceName, setWorkspaceName] = useState('');
  
  const [formData, setFormData] = useState({
    full_name: '',
    company_name: '',
    plan: 'startup'
  });

  const handleSetupComplete = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Determine the exact persona/role to send to the database
      const finalRole = hasCompany ? 'corporate' : (soloRole === 'other' ? customRole : soloRole);
      const finalCompany = hasCompany ? formData.company_name : `${finalRole.toUpperCase()} WORKSPACE`;

      const finalPayload = {
        full_name: formData.full_name,
        company_name: finalCompany,
        plan: formData.plan,
        user_persona: finalRole // Send this to backend so you know EXACTLY who is using your app!
      };

      await api.put('/auth/profile', finalPayload); 
      navigate('/setup');
      
    } catch (err) {
      console.error("Setup failed:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-6">
      <div className="w-full max-w-2xl animate-in fade-in zoom-in-95 duration-500">
        
        <div className="text-center mb-12">
          <div className="w-16 h-16 bg-blue-600/20 border border-blue-500/30 rounded-3xl flex items-center justify-center mx-auto mb-6">
             <CheckCircle2 className="text-blue-500" size={32} />
          </div>
          <h2 className="text-4xl font-black italic text-white uppercase tracking-tighter">Identity Verified</h2>
          <p className="text-xs text-slate-500 font-bold uppercase tracking-[0.4em] mt-3">Configure your perimeter defenses</p>
        </div>

        <form onSubmit={handleSetupComplete} className="bg-[#0a0a0a] border border-white/5 rounded-[40px] p-10 shadow-2xl space-y-8">
          
          {/* OPERATIVE NAME */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
              <User size={12}/> Operative Name
            </label>
            <input 
              type="text" 
              required 
              placeholder="John Doe"
              className="w-full bg-black border border-white/10 rounded-2xl p-4 text-sm text-white outline-none focus:border-blue-500/50 transition-colors" 
              onChange={e => setFormData({...formData, full_name: e.target.value})} 
            />
          </div>

          {/* DYNAMIC ORGANIZATION / PERSONA SECTION */}
          <div className="p-6 bg-white/[0.02] border border-white/5 rounded-3xl transition-all duration-300">
            {hasCompany ? (
              // COMPANY INPUT
              <div className="space-y-3 animate-in fade-in">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <Building size={12}/> Organization Name
                  </label>
                  <button type="button" onClick={() => setHasCompany(false)} className="text-[9px] text-blue-500 hover:text-white font-bold uppercase tracking-widest transition-colors">
                    Don't have a company?
                  </button>
                </div>
                <input 
                  type="text" 
                  required={hasCompany}
                  placeholder="Acme Corp"
                  className="w-full bg-black border border-white/10 rounded-2xl p-4 text-sm text-white outline-none focus:border-blue-500/50 transition-colors" 
                  onChange={e => setFormData({...formData, company_name: e.target.value})} 
                />
              </div>
            ) : (
              // PERSONA SELECTOR (When they don't have a company)
              <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <Briefcase size={12}/> Who are you?
                  </label>
                  <button type="button" onClick={() => setHasCompany(true)} className="text-[9px] text-blue-500 hover:text-white font-bold uppercase tracking-widest transition-colors">
                    I have a company
                  </button>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <PersonaButton icon={<GraduationCap size={16}/>} label="Student" value="student" current={soloRole} setRole={setSoloRole} />
                  <PersonaButton icon={<Code size={16}/>} label="Solo Dev" value="solo_dev" current={soloRole} setRole={setSoloRole} />
                  <PersonaButton icon={<TestTube size={16}/>} label="Researcher" value="researcher" current={soloRole} setRole={setSoloRole} />
                  <PersonaButton icon={<Edit3 size={16}/>} label="Other" value="other" current={soloRole} setRole={setSoloRole} />
                </div>

                {/* SHOW CUSTOM INPUT IF 'OTHER' IS SELECTED */}
                {soloRole === 'other' && (
                  <div className="pt-2 animate-in fade-in slide-in-from-top-2">
                    <input 
                      type="text" 
                      required={soloRole === 'other'}
                      placeholder="Please specify your role..."
                      className="w-full bg-black border border-blue-500/30 rounded-xl p-3 text-sm text-white outline-none focus:border-blue-500 transition-colors" 
                      onChange={e => setCustomRole(e.target.value)} 
                    />
                  </div>
                )}
              </div>
            )}

            <div>
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Workspace / Team Name</label>
            <input 
              type="text" 
              value={workspaceName} 
              onChange={(e) => setWorkspaceName(e.target.value)}
              placeholder="e.g. Alpha Security Hub"
              className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl p-3 text-white focus:border-blue-500"
            />
          </div>
          </div>

          {/* PLAN SELECTION */}
          <div className="space-y-4">
             <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                <Target size={12}/> Security Plan
              </label>
             <div className="grid grid-cols-2 gap-4">
                <div 
                  onClick={() => setFormData({...formData, plan: 'startup'})}
                  className={`p-5 rounded-2xl border cursor-pointer transition-all ${formData.plan === 'startup' ? 'bg-blue-600/10 border-blue-500 text-blue-400' : 'bg-black border-white/10 text-slate-500 hover:border-white/20'}`}
                >
                   <h4 className="text-xs font-black uppercase mb-1">Standard Node</h4>
                   <p className="text-[9px] uppercase tracking-widest opacity-70">Basic IDS & Traffic logs</p>
                </div>
                <div 
                  onClick={() => setFormData({...formData, plan: 'enterprise'})}
                  className={`p-5 rounded-2xl border cursor-pointer transition-all ${formData.plan === 'enterprise' ? 'bg-purple-600/10 border-purple-500 text-purple-400' : 'bg-black border-white/10 text-slate-500 hover:border-white/20'}`}
                >
                   <h4 className="text-xs font-black uppercase mb-1">Advanced Core</h4>
                   <p className="text-[9px] uppercase tracking-widest opacity-70">Deep packet ML & GeoIP</p>
                </div>
             </div>
          </div>

          <button disabled={loading} className="w-full py-5 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-2xl uppercase text-[11px] tracking-[0.2em] transition-all mt-8 shadow-[0_0_30px_rgba(37,99,235,0.2)] disabled:opacity-50">
            {loading ? <Loader2 className="animate-spin mx-auto" size={20} /> : "Generate API Key"}
          </button>
        </form>

      </div>
    </div>
  );
}

// Helper Component for Persona Buttons
function PersonaButton({ icon, label, value, current, setRole }: any) {
  const isActive = current === value;
  return (
    <div 
      onClick={() => setRole(value)}
      className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${isActive ? 'bg-blue-600/20 border-blue-500 text-blue-400' : 'bg-black border-white/10 text-slate-400 hover:border-white/30'}`}
    >
      {icon}
      <span className="text-[10px] font-black uppercase tracking-widest">{label}</span>
    </div>
  );
}