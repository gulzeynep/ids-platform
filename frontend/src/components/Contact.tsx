import { Mail, MessageSquare, ArrowLeft, Send } from 'lucide-react';

export default function Contact({ onBack }: any) {
  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-6">
      <div className="w-full max-w-2xl bg-[#0a0a0a] border border-white/5 p-10 rounded-[40px] relative shadow-2xl">
        <button onClick={onBack} className="absolute -top-12 left-0 text-slate-500 hover:text-white flex items-center gap-2 transition-colors">
          <ArrowLeft size={16} /> Return to Base
        </button>

        <div className="grid md:grid-cols-2 gap-12">
          <div>
            <h2 className="text-4xl font-black text-white mb-6 tracking-tighter">GET IN <br/> TOUCH.</h2>
            <p className="text-slate-500 text-sm leading-relaxed mb-8">
              Need technical support or want to integrate W-IDS into your infrastructure? Our tactical team is ready.
            </p>
            <div className="space-y-4">
              <div className="flex items-center gap-4 text-blue-400 font-mono text-xs">
                <Mail size={16} /> support@wids-platform.com
              </div>
              <div className="flex items-center gap-4 text-slate-500 font-mono text-xs">
                <MessageSquare size={16} /> Discord: W-IDS_Global
              </div>
            </div>
          </div>

          <form className="space-y-4 bg-white/5 p-6 rounded-3xl border border-white/5">
            <input type="text" placeholder="Your Name" className="w-full bg-black border border-white/5 rounded-xl p-3 text-sm outline-none focus:border-blue-500/50" />
            <textarea placeholder="Message" rows={4} className="w-full bg-black border border-white/5 rounded-xl p-3 text-sm outline-none focus:border-blue-500/50" />
            <button className="w-full bg-blue-600 py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-blue-500">
              <Send size={16} /> DISPATCH
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}