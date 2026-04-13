import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Rocket, Building2, UserCircle, ArrowRight, Loader2 } from 'lucide-react';
import api from '../lib/api';

const Onboarding = () => {
  const [step, setStep] = useState(1);
  const [data, setData] = useState({ workspace_name: '', persona: 'Security Analyst' });
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleComplete = async () => {
    setIsLoading(true);
    try {
      await api.post('/auth/onboard', data);
      navigate('/overview');
    } catch (err) {
      alert("Onboarding failed. Workspace name might be taken.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto mt-20 bg-slate-900 border border-slate-800 rounded-3xl p-10 shadow-2xl">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center">
          <Rocket className="text-white w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">System Initialization</h1>
          <p className="text-slate-500 text-sm">Step {step} of 2</p>
        </div>
      </div>

      {step === 1 ? (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
          <div className="space-y-2">
            <label className="text-slate-300 font-medium flex items-center gap-2">
              <Building2 className="w-4 h-4 text-blue-500" /> Workspace Identity
            </label>
            <input 
              type="text" 
              placeholder="e.g. Alpha-Squad-SOC"
              className="w-full bg-slate-800 border border-slate-700 rounded-xl p-4 text-white outline-none focus:ring-2 focus:ring-blue-500"
              value={data.workspace_name}
              onChange={(e) => setData({...data, workspace_name: e.target.value})}
            />
          </div>
          <button 
            disabled={!data.workspace_name}
            onClick={() => setStep(2)}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 disabled:opacity-50"
          >
            Continue to Persona <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      ) : (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
          <div className="grid grid-cols-2 gap-4">
            {['Security Analyst', 'Network Admin', 'CISO', 'Researcher'].map((p) => (
              <button 
                key={p}
                onClick={() => setData({...data, persona: p})}
                className={`p-4 rounded-xl border transition-all text-sm font-bold ${
                  data.persona === p ? 'border-blue-500 bg-blue-500/10 text-white' : 'border-slate-800 bg-slate-950 text-slate-500'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
          <div className="flex gap-4">
            <button onClick={() => setStep(1)} className="flex-1 bg-slate-800 text-white py-4 rounded-xl font-bold">Back</button>
            <button 
              onClick={handleComplete}
              className="flex-[2] bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2"
            >
              {isLoading ? <Loader2 className="animate-spin" /> : 'Finalize Setup'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Onboarding;