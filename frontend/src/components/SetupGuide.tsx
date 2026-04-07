import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Terminal, Copy, CheckCircle2, Shield, ArrowRight } from 'lucide-react';
import api from '../lib/api';

export default function SetupGuide() {
  const navigate = useNavigate();
  const [apiKey, setApiKey] = useState("GENERATING_KEY...");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Fetch the actual API key from backend (We will build this backend route next!)
    const fetchApiKey = async () => {
      try {
        const res = await api.get('/auth/me'); 
        // Assuming your backend sends the api_key inside the user profile data
        setApiKey(res.data.api_key || "wids_live_test_key_987654321");
      } catch (err) {
        console.error("Failed to load API key");
      }
    };
    fetchApiKey();
  }, []);

  const handleCopy = () => {
    navigator.clipboard.writeText(apiKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-6 relative">
      <div className="w-full max-w-3xl animate-in fade-in zoom-in-95 duration-500">
        
        <div className="text-center mb-10">
          <Shield className="text-blue-500 w-16 h-16 mx-auto mb-4" />
          <h2 className="text-4xl font-black italic text-white uppercase tracking-tighter">Deploy Your Sensor</h2>
          <p className="text-xs text-slate-500 font-bold uppercase tracking-[0.4em] mt-3">Your perimeter is currently blind. Install the agent to begin.</p>
        </div>

        <div className="bg-[#0a0a0a] border border-white/5 rounded-[40px] p-10 shadow-2xl">
          
          {/* API KEY SECTION */}
          <div className="mb-10">
            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Your Secret Access Token</h3>
            <div className="flex items-center gap-4 bg-black border border-white/10 rounded-2xl p-2 pl-6">
              <span className="font-mono text-sm text-green-400 flex-1 blur-[2px] hover:blur-none transition-all cursor-crosshair">
                {apiKey}
              </span>
              <button 
                onClick={handleCopy}
                className="bg-white/5 hover:bg-white/10 text-white p-4 rounded-xl transition-all flex items-center gap-2"
              >
                {copied ? <CheckCircle2 size={16} className="text-green-500" /> : <Copy size={16} />}
              </button>
            </div>
            <p className="text-[9px] text-red-500 font-bold uppercase mt-3">Warning: Do not share this key. It grants full write access to your logs.</p>
          </div>

          {/* INSTALLATION COMMAND */}
          <div>
            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
              <Terminal size={14} /> Server Installation Command (Linux/Ubuntu)
            </h3>
            <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 font-mono text-xs text-slate-300 relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
              <p>curl -sL https://api.w-ids.com/install.sh | bash -s -- \</p>
              <p className="mt-2 pl-4 text-blue-400">--api-key="{apiKey}"</p>
            </div>
          </div>

          {/* ACTION BUTTONS */}
          <div className="mt-12 pt-8 border-t border-white/5 flex gap-4">
             <button onClick={() => navigate('/overview')} className="flex-1 py-5 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-2xl uppercase text-[11px] tracking-widest transition-all shadow-[0_0_30px_rgba(37,99,235,0.2)] flex items-center justify-center gap-3">
               Enter War Room <ArrowRight size={16} />
             </button>
             <button className="px-8 py-5 bg-white/5 hover:bg-white/10 text-slate-400 font-black rounded-2xl uppercase text-[10px] tracking-widest transition-all">
               Read Docs
             </button>
          </div>

        </div>
      </div>
    </div>
  );
}