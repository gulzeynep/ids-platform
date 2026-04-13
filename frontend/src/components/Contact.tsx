import { Mail, MessageSquare, Terminal, Send } from 'lucide-react';

const Contact = () => {
  return (
    <div className="max-w-4xl mx-auto py-12 px-6">
      <div className="text-center mb-16">
        <h1 className="text-4xl font-bold text-white mb-4">Support Terminal</h1>
        <p className="text-slate-400">Reach out to our security engineers for system assistance</p>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-1 space-y-6">
          <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800">
            <Mail className="text-blue-500 mb-4" />
            <h4 className="text-white font-bold">Direct Secure Mail</h4>
            <p className="text-slate-400 text-xs">support@wids-platform.io</p>
          </div>
          <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800">
            <Terminal className="text-emerald-500 mb-4" />
            <h4 className="text-white font-bold">Encrypted Comms</h4>
            <p className="text-slate-400 text-xs">PGP: 0x4F2A...B912</p>
          </div>
        </div>

        <form className="md:col-span-2 bg-slate-900 p-8 rounded-2xl border border-slate-800 space-y-4">
          <input type="text" placeholder="Subject / Incident ID" className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white outline-none focus:ring-2 focus:ring-blue-500" />
          <textarea rows={5} placeholder="Describe the security anomaly or system issue..." className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white outline-none focus:ring-2 focus:ring-blue-500" />
          <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2">
            <Send className="w-4 h-4" /> Dispatch Message
          </button>
        </form>
      </div>
    </div>
  );
};

export default Contact;