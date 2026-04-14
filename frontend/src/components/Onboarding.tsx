import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Rocket, Shield, User, Globe, Loader2 } from 'lucide-react';
import api from '../lib/api';

const Onboarding = () => {
  const [workspaceName, setWorkspaceName] = useState('');
  const [persona, setPersona] = useState('Analyst');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleComplete = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      // Backend'deki complete_onboarding endpoint'ine istek atar
      await api.post('/auth/onboarding', { 
        workspace_name: workspaceName, 
        persona: persona 
      });
      navigate('/dashboard');
    } catch (err) {
      console.error("Onboarding failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-slate-900/50 border border-white/10 rounded-3xl p-10 backdrop-blur-md">
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-blue-600/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-blue-500/30">
            <Rocket className="text-blue-400 w-10 h-10" />
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight">Finalize Deployment</h2>
          <p className="text-slate-400 mt-2">Set up your workspace and choose your role.</p>
        </div>

        <form onSubmit={handleComplete} className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-slate-500 ml-1">Workspace Name</label>
            <div className="relative">
              <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input 
                type="text" required placeholder="e.g., CyberGuard HQ"
                className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 pl-12 pr-4 outline-none focus:border-blue-500/50 transition-all"
                value={workspaceName} onChange={(e) => setWorkspaceName(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-slate-500 ml-1">Designated Persona</label>
            <div className="grid grid-cols-2 gap-3">
              {['Analyst', 'Admin'].map((p) => (
                <button
                  key={p} type="button"
                  onClick={() => setPersona(p)}
                  className={`py-4 rounded-2xl border transition-all font-bold ${
                    persona === p ? 'bg-blue-600 border-blue-500 text-white' : 'bg-black/40 border-white/10 text-slate-500 hover:border-white/20'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <button 
            disabled={isLoading || !workspaceName}
            className="w-full bg-white text-black font-black py-5 rounded-2xl hover:bg-slate-200 transition-all flex items-center justify-center gap-3 shadow-xl shadow-white/5"
          >
            {isLoading ? <Loader2 className="animate-spin w-6 h-6" /> : 'Launch Platform'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Onboarding;