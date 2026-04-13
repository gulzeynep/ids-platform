import { Terminal, Key, Cpu, CheckCircle } from 'lucide-react';

const SetupGuide = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-8 rounded-3xl text-white">
        <h1 className="text-3xl font-bold mb-2">Sensor Connection Guide</h1>
        <p className="opacity-80">Follow these steps to link your network probes to the W-IDS Core.</p>
      </div>

      <div className="grid gap-6">
        {[
          { icon: Key, title: "Generate API Token", desc: "Go to your Profile settings and generate a unique Workspace API Key." },
          { icon: Cpu, title: "Install Agent", desc: "Download the W-IDS python sensor on your edge devices." },
          { icon: Terminal, title: "Initialize Connection", desc: "Run: python sensor.py --key YOUR_API_KEY --server api.wids-core.io" }
        ].map((step, i) => (
          <div key={i} className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex gap-6">
            <div className="w-12 h-12 bg-slate-800 rounded-xl flex items-center justify-center shrink-0">
              <step.icon className="text-blue-500 w-6 h-6" />
            </div>
            <div>
              <h4 className="text-white font-bold mb-1">{step.title}</h4>
              <p className="text-slate-400 text-sm">{step.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SetupGuide;