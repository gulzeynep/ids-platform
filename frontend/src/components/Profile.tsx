import { User, Key, Building, LogOut, ArrowLeft } from 'lucide-react';

export default function Profile({ user, onBack, onLogout }: any) {
  return (
    <div className="max-w-2xl mx-auto pt-20 px-6">
      <button onClick={onBack} className="flex items-center gap-2 text-slate-500 hover:text-white mb-8 transition-colors">
        <ArrowLeft size={18} /> Back to Dashboard
      </button>
      
      <div className="bg-[#0a0a0a] border border-white/5 rounded-3xl p-8">
        <h2 className="text-3xl font-bold mb-8 flex items-center gap-3">
           <User className="text-blue-500" /> Operator Profile
        </h2>

        <div className="space-y-6">
          <ProfileItem icon={<User size={18}/>} label="Username" value={user?.username || 'admin_ops'} />
          <ProfileItem icon={<Building size={18}/>} label="Organization" value={user?.company_name || 'Cyber Security Division'} />
          <div className="p-4 bg-blue-500/5 border border-blue-500/10 rounded-2xl">
            <div className="flex items-center gap-2 text-[10px] font-bold text-blue-500 uppercase mb-2">
              <Key size={12} /> Master API Key
            </div>
            <code className="text-xs break-all text-blue-300 font-mono">
              {localStorage.getItem('token')?.substring(0, 32)}...
            </code>
          </div>
        </div>

        <button 
          onClick={onLogout}
          className="w-full mt-12 flex items-center justify-center gap-2 p-4 bg-red-500/10 text-red-500 rounded-2xl font-bold hover:bg-red-500 hover:text-white transition-all"
        >
          <LogOut size={18} /> TERMINATE SESSION
        </button>
      </div>
    </div>
  );
}

function ProfileItem({ icon, label, value }: any) {
  return (
    <div className="flex items-center justify-between py-4 border-b border-white/5">
      <div className="flex items-center gap-3 text-slate-400 text-sm">
        {icon} <span>{label}</span>
      </div>
      <span className="font-bold text-white text-sm">{value}</span>
    </div>
  );
}