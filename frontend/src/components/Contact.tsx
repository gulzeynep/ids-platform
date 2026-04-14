import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Mail, MessageSquare, Send, ArrowLeft, Globe, MapPin } from 'lucide-react';

export default function Contact() {
  const navigate = useNavigate();
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    // Real logic would go here (e.g., sending email via backend)
  };
  

  return (
    <div className="min-h-screen bg-[#050505] text-slate-200 flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/5 blur-[120px] rounded-full pointer-events-none" />
      
      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-12 relative z-10 animate-in fade-in zoom-in-95 duration-500">
        
        {/* LEFT SIDE: INFO */}
        <div className="flex flex-col justify-center">
          <button 
            onClick={() => {
              const token = localStorage.getItem('token');
              token ? navigate('/overview') : navigate('/');
            }} 
            className="flex items-center gap-2 text-blue-500 hover:text-blue-400 font-bold text-xs uppercase tracking-widest mb-8 transition-colors group"
          >
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> 
            {localStorage.getItem('token') ? 'Back to Dashboard' : 'Back to HQ'}
          </button>
          
          <h2 className="text-5xl font-black text-white italic tracking-tighter mb-6 leading-none">
            GET IN <br /> <span className="text-blue-500">TOUCH.</span>
          </h2>
          <p className="text-slate-400 text-lg mb-10 max-w-md">
            Need custom IDS integration or enterprise support? Our security engineers are ready to assist you.
          </p>

          <div className="space-y-6">
            <div className="flex items-center gap-4 group">
              <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-blue-500 group-hover:border-blue-500/50 transition-all">
                <Mail size={20} />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Support Email</p>
                <p className="text-white font-mono">ops@wids-core.io</p>
              </div>
            </div>
            <div className="flex items-center gap-4 group">
              <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-blue-500 group-hover:border-blue-500/50 transition-all">
                <Globe size={20} />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Global HQ</p>
                <p className="text-white font-mono">wids-platform.dev</p>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT SIDE: FORM */}
        <div className="bg-[#0a0a0a] border border-white/5 rounded-[40px] p-10 shadow-2xl relative overflow-hidden">
          {submitted ? (
            <div className="h-full flex flex-col items-center justify-center text-center animate-in zoom-in duration-300">
              <div className="w-20 h-20 bg-green-500/10 border border-green-500/20 rounded-full flex items-center justify-center text-green-500 mb-6">
                <Send size={32} />
              </div>
              <h3 className="text-2xl font-black text-white italic">MESSAGE TRANSMITTED</h3>
              <p className="text-slate-500 mt-2">We will respond shortly via encrypted channels.</p>
              <button onClick={() => setSubmitted(false)} className="mt-8 text-blue-500 font-bold text-xs uppercase underline">Send another</button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Your Name</label>
                  <input type="text" required className="w-full bg-[#050505] border border-white/10 rounded-xl py-3 px-4 text-white text-sm focus:border-blue-500/50 outline-none" placeholder="John Doe" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Work Email</label>
                  <input type="email" required className="w-full bg-[#050505] border border-white/10 rounded-xl py-3 px-4 text-white text-sm focus:border-blue-500/50 outline-none" placeholder="john@company.com" />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Subject</label>
                <select className="w-full bg-[#050505] border border-white/10 rounded-xl py-3 px-4 text-white text-sm focus:border-blue-500/50 outline-none">
                  <option>Enterprise Licensing</option>
                  <option>Technical Support</option>
                  <option>Custom Feature Request</option>
                  <option>Bug Report</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Transmission Details</label>
                <textarea rows={4} required className="w-full bg-[#050505] border border-white/10 rounded-xl py-3 px-4 text-white text-sm focus:border-blue-500/50 outline-none resize-none" placeholder="Describe your request..." />
              </div>
              <button type="submit" className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white font-black text-sm uppercase tracking-wider rounded-xl transition-all shadow-[0_0_20px_rgba(37,99,235,0.2)]">
                Send Transmission
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}