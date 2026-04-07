import { useEffect, useState } from 'react';
import { User, Mail, Building, ShieldCheck, Clock, Key, Save, X } from 'lucide-react';
import api from '../lib/api';

export default function Profile() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // --- EDIT STATE ---
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ full_name: '', user_persona: '' });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await api.get('/auth/me');
      setUser(res.data);
      setEditForm({
        full_name: res.data.full_name || '',
        user_persona: res.data.user_persona || ''
      });
    } catch (error) {
      console.error("Could not retrieve profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      await api.patch('/auth/me', editForm);
      setIsEditing(false);
      fetchProfile(); // Refresh data to show changes
    } catch (error) {
      console.error("Failed to update profile", error);
    }
  };

  if (loading) {
    return (
      <div className="h-full w-full flex items-center justify-center p-20">
        <div className="w-8 h-8 border-2 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return <div className="text-white p-8">User intelligence unavailable. Please re-authenticate.</div>;
  }

  const isPendingOnboarding = !user.workspace_id;

  return (
    <div className="max-w-4xl mx-auto p-8 animate-in fade-in duration-500">
      <div className="mb-10">
        <h2 className="text-3xl font-black italic text-white uppercase tracking-tighter">Operative Profile</h2>
        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.3em] mt-1">Identity and Access Management</p>
      </div>

      <div className="bg-[#0a0a0a] border border-white/5 rounded-[40px] p-10 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>

        <div className="flex items-center gap-8 mb-12 relative z-10">
          <div className="w-24 h-24 bg-blue-600/20 border border-blue-500/30 rounded-3xl flex items-center justify-center text-blue-500 shadow-[0_0_30px_rgba(37,99,235,0.2)]">
            <User size={40} />
          </div>
          <div className="flex-1">
            
            {/* EDIT MODE TOGGLE FOR FULL NAME */}
            <div className="p-5 bg-white/[0.02] border border-white/5 rounded-2xl group hover:border-white/10 transition-all">
            <div className="flex items-center gap-2 text-slate-500 mb-2">
              <Key size={16}/>
              <span className="text-[9px] font-black uppercase tracking-[0.2em]">Persona</span>
            </div>
            
            {isEditing ? (
              <select 
                value={editForm.user_persona}
                onChange={(e) => setEditForm({...editForm, user_persona: e.target.value})}
                className="text-sm font-bold text-white font-mono bg-[#0a0a0a] border border-white/20 rounded-lg px-3 py-2 w-full focus:outline-none focus:border-blue-500 appearance-none cursor-pointer"
              >
                <option value="" disabled>Select your persona</option>
                <option value="Cybersecurity Student">Student</option>
                <option value="Solo Developer">Solo Developer</option>
                <option value="Security Analyst">Security Analyst</option>
                <option value="IT Administrator">IT Administrator</option>
                <option value="Researcher">Researcher</option>
                <option value="Other">Other</option>
              </select>
            ) : (
              <p className="text-sm font-bold text-white font-mono">{user.user_persona || 'Unassigned'}</p>
            )}
          </div>

            <div className="flex items-center gap-3 mt-3">
               <span className="bg-blue-500/10 text-blue-500 border border-blue-500/20 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                  <ShieldCheck size={12}/> {user.role}
               </span>
               <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${user.is_active ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'}`}>
                  {user.is_active ? 'Active Clearance' : 'Suspended'}
               </span>
               {isPendingOnboarding && (
                 <span className="bg-orange-500/10 text-orange-500 border border-orange-500/20 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest">
                    Awaiting Onboarding
                 </span>
               )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
          <ProfileField icon={<Mail size={16}/>} label="Comm Channel" value={user.email} />
          <ProfileField icon={<Building size={16}/>} label="Organization" value={user.company_name} />
          <ProfileField icon={<Clock size={16}/>} label="Account Created" value={new Date(user.created_at).toLocaleDateString()} />
          
          {/* EDIT MODE TOGGLE FOR PERSONA */}
          <div className="p-5 bg-white/[0.02] border border-white/5 rounded-2xl group hover:border-white/10 transition-all">
            <div className="flex items-center gap-2 text-slate-500 mb-2">
              <Key size={16}/>
              <span className="text-[9px] font-black uppercase tracking-[0.2em]">Persona</span>
            </div>
            {isEditing ? (
              <input 
                type="text" 
                value={editForm.user_persona}
                onChange={(e) => setEditForm({...editForm, user_persona: e.target.value})}
                placeholder="e.g. Lead Analyst"
                className="text-sm font-bold text-white font-mono bg-black/50 border border-white/10 rounded-lg px-3 py-1.5 w-full focus:outline-none focus:border-blue-500"
              />
            ) : (
              <p className="text-sm font-bold text-white font-mono">{user.user_persona || 'Unassigned'}</p>
            )}
          </div>
        </div>

        {/* ACTION BUTTONS */}
        <div className="mt-12 pt-8 border-t border-white/5 relative z-10 flex gap-4">
           {isEditing ? (
             <>
               <button onClick={handleSave} className="px-6 py-3 bg-green-500 hover:bg-green-400 text-black rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 shadow-[0_0_20px_rgba(34,197,94,0.2)]">
                 <Save size={14}/> Save Changes
               </button>
               <button onClick={() => setIsEditing(false)} className="px-6 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2">
                 <X size={14}/> Cancel
               </button>
             </>
           ) : (
             <button onClick={() => setIsEditing(true)} className="px-6 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">
               Update Credentials
             </button>
           )}
           
           {!isEditing && (
             <button className="px-6 py-3 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border border-red-500/20 ml-auto">
                Revoke Access
             </button>
           )}
        </div>

      </div>
    </div>
  );
}

function ProfileField({ icon, label, value }: { icon: any, label: string, value: string }) {
  return (
    <div className="p-5 bg-white/[0.02] border border-white/5 rounded-2xl group hover:border-white/10 transition-all">
      <div className="flex items-center gap-2 text-slate-500 mb-2">
        {icon}
        <span className="text-[9px] font-black uppercase tracking-[0.2em]">{label}</span>
      </div>
      <p className="text-sm font-bold text-white font-mono">{value}</p>
    </div>
  );
}