import { useEffect, useState, useCallback } from 'react';
import { 
  Users, UserPlus, Shield, Settings, Bell, 
  ShieldAlert, Server, CheckCircle, AlertTriangle, Check, X
} from 'lucide-react';
import api from '../lib/api';

// --- INTERFACES ---
interface User {
  id: number;
  email: string;
  role: string;
  is_active: boolean;
  full_name?: string;
  api_key?: string; // Real API key from backend
}

interface NotificationData {
  id: number;
  title: string;
  body: string;
  type: string;
  is_read: boolean;
  timestamp: string;
}

export default function Management() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [teamMembers, setTeamMembers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newMember, setNewMember] = useState({ email: '', password: '', role: 'analyst' });
  const [selectedMember, setSelectedMember] = useState<User | null>(null);
  const [editRole, setEditRole] = useState("");
  const [showIntegrationModal, setShowIntegrationModal] = useState(false);
  const [activeOsTab, setActiveOsTab] = useState<'linux' | 'windows' | 'node' | 'python'>('linux');

  // --- FETCH DATA ---
  const fetchData = useCallback(async () => {
    try {
      const userRes = await api.get('/auth/me');
      setCurrentUser(userRes.data);

      const teamRes = await api.get('/admin/team'); 
      setTeamMembers(teamRes.data);
    } catch (error) {
      console.error("Failed to fetch management data:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // --- HANDLERS --- 
  const openMemberDetail = (member: User) => {
    setSelectedMember(member);
    setEditRole(member.role);
  };

  const handleUpdateRole = async () => {
    if (!selectedMember) return;
    try {
      // Note: Ensure your backend endpoint matches exactly: /admin/team/{id}/grant-access
      await api.patch(`/admin/team/${selectedMember.id}/grant-access?new_role=${editRole}`);
      fetchData();
      setSelectedMember(null);
    } catch (error) {
      console.error("Failed to update clearance:", error);
    }
  };

  const handleToggleAccess = async () => {
    if (!selectedMember) return;
    try {
      // Force refresh data and close modal on success
      await api.patch(`/admin/team/${selectedMember.id}/toggle-access`);
      await fetchData();
      setSelectedMember(null);
    } catch (error) {
      console.error("Failed to toggle access:", error);
    }
  };

  const handleDeploy = async () => {
    try {
      await api.post('/admin/team/add', newMember);
      setShowAddModal(false);
      setNewMember({ email: '', password: '', role: 'analyst' });
      fetchData();
    } catch (error) {
      console.error("Failed to deploy operative:", error);
      alert("Deployment failed.");
    }
  };

  if (loading) {
    return (
      <div className="h-full w-full flex items-center justify-center p-20">
        <div className="w-8 h-8 border-2 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-[1400px] mx-auto p-6 animate-in fade-in duration-500">
      
      {/* --- HEADER --- */}
      <div className="mb-8 border-b border-white/5 pb-6">
        <h2 className="text-3xl font-black italic tracking-tighter text-blue-500 uppercase">Command & Control</h2>
        <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em] mt-1">Workspace Management & System Intelligence</p>
      </div>

      <div className="flex flex-col xl:flex-row gap-8">
        
        {/* --- LEFT COLUMN: TEAM & SETTINGS --- */}
        <div className="flex-1 space-y-8">
          
          {/* Team Management Section */}
          <div className="bg-[#0a0a0a] border border-white/5 rounded-[32px] p-8 relative overflow-hidden">
            <div className="flex justify-between items-end mb-8 border-b border-white/5 pb-4">
              <div>
                <h3 className="text-xl font-black italic text-white uppercase tracking-tight flex items-center gap-2">
                  <Users size={20} className="text-blue-500"/> Active Operatives
                </h3>
                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.2em] mt-1">Workspace Access Control</p>
              </div>
              
              {currentUser?.role === 'admin' && (
                <button onClick={() => setShowAddModal(true)} 
                  className="px-5 py-2.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-500 border border-blue-500/20 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 shadow-[0_0_15px_rgba(37,99,235,0.1)] flex items-center gap-2">
                  <UserPlus size={14} /> Deploy Operative
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {teamMembers.map((member) => (
                <div 
                  key={member.id} 
                  onClick={() => openMemberDetail(member)} 
                  className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl flex items-center gap-4 hover:border-white/20 transition-all cursor-pointer hover:translate-x-1"
                >
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${member.is_active ? 'bg-blue-500/10 text-blue-500' : 'bg-red-500/10 text-red-500'}`}>
                    <Shield size={20} />
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <h4 className="text-sm font-bold text-white truncate">{member.email}</h4>
                    <div className="flex gap-2 mt-1">
                      <span className="text-[8px] font-black text-blue-400 uppercase tracking-widest bg-blue-500/10 px-2 py-0.5 rounded">
                        {member.role}
                      </span>
                      <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded ${member.is_active ? 'text-green-400 bg-green-500/10' : 'text-red-400 bg-red-500/10'}`}>
                        {member.is_active ? 'Active' : 'Suspended'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* System Settings Section - ENHANCED SPACING */}
          <div className="bg-[#0a0a0a] border border-white/5 rounded-[32px] p-8">
            <div className="flex items-center gap-2 mb-10">
              <Settings size={20} className="text-slate-400"/>
              <h3 className="text-xl font-black italic text-white uppercase tracking-tight">Security Preferences</h3>
            </div>
            
            <div className="flex flex-col gap-6">
              <div className="p-5 bg-white/[0.02] border border-white/5 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 hover:border-white/10 transition-all">
                <div className="max-w-[320px]">
                  <h4 className="text-sm font-bold text-white uppercase tracking-tight">Critical Email Alerts</h4>
                  <p className="text-[11px] text-slate-500 mt-2 leading-relaxed">
                    Receive emergency intelligence reports when severity reaches CRITICAL.
                  </p>
                </div>
                <div className="w-12 h-6 bg-blue-500 rounded-full relative cursor-pointer shrink-0">
                  <div className="w-4 h-4 bg-white rounded-full absolute right-1 top-1"></div>
                </div>
              </div>

              <div className="p-5 bg-white/[0.02] border border-white/5 rounded-2xl flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 group hover:border-white/10 transition-all">
                <div className="max-w-[320px]">
                  <h4 className="text-sm font-bold text-white uppercase tracking-tight">Sensor Integration</h4>
                  <p className="text-[11px] text-slate-500 mt-2 leading-relaxed">
                    Access deployment scripts and unique workspace API keys for external nodes.
                  </p>
                </div>
                <button 
                  onClick={() => setShowIntegrationModal(true)}
                  className="w-full lg:w-auto px-6 py-3.5 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all active:scale-95 flex items-center justify-center gap-3 shrink-0"
                >
                  <Server size={14} className="text-blue-500 group-hover:text-blue-400"/> 
                  Setup Guide
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* --- RIGHT COLUMN: NOTIFICATIONS FEED --- */}
        <div className="w-full xl:w-[450px]">
          <NotificationsFeed />
        </div>
      </div>

      {/* --- ALL MODALS --- */}

      {/* DEPLOY MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-[#0a0a0a] border border-white/10 rounded-[32px] w-full max-w-md p-8 shadow-2xl relative">
            <div className="mb-6">
              <h3 className="text-2xl font-black italic text-white uppercase tracking-tight">Deploy Operative</h3>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em] mt-1">Grant workspace access</p>
            </div>
            <div className="space-y-4">
              <input 
                type="email" 
                value={newMember.email}
                onChange={(e) => setNewMember({...newMember, email: e.target.value})}
                placeholder="Email Address"
                className="w-full bg-white/[0.02] border border-white/5 rounded-xl p-3 text-sm text-white focus:border-blue-500 transition-colors"
              />
              <input 
                type="password" 
                value={newMember.password}
                onChange={(e) => setNewMember({...newMember, password: e.target.value})}
                placeholder="Initial Passkey"
                className="w-full bg-white/[0.02] border border-white/5 rounded-xl p-3 text-sm text-white focus:border-blue-500 transition-colors"
              />
              <select 
                value={newMember.role}
                onChange={(e) => setNewMember({...newMember, role: e.target.value})}
                className="w-full bg-[#0a0a0a] border border-white/5 rounded-xl p-3 text-sm font-bold text-white uppercase"
              >
                <option value="analyst">Analyst</option>
                <option value="admin">Admin</option>
                <option value="viewer">Viewer</option>
              </select>
            </div>
            <div className="mt-8 flex gap-3">
              <button onClick={() => setShowAddModal(false)} className="flex-1 py-3 bg-white/5 text-white rounded-xl text-[10px] font-black uppercase">Cancel</button>
              <button onClick={handleDeploy} className="flex-1 py-3 bg-blue-500 text-black rounded-xl text-[10px] font-black uppercase shadow-lg">Confirm</button>
            </div>
          </div>
        </div>
      )}

      {/* OPERATIVE DETAIL MODAL - WITH ROLE LOCKING */}
      {selectedMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-[#0a0a0a] border border-white/10 rounded-[32px] w-full max-w-md p-8 shadow-2xl relative">
            <div className="flex justify-between items-start mb-6 border-b border-white/5 pb-6">
              <div className="flex items-center gap-4">
                <div className={`p-4 rounded-2xl ${selectedMember.is_active ? 'bg-blue-500/10 text-blue-500' : 'bg-red-500/10 text-red-500'}`}>
                  <Shield size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-black italic text-white uppercase truncate max-w-[200px]">{selectedMember.email.split('@')[0]}</h3>
                  <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-1">Operative Details</p>
                </div>
              </div>
              <button onClick={() => setSelectedMember(null)} className="p-2 hover:bg-white/5 rounded-full text-slate-400"><X size={20}/></button>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl">
                  <p className="text-[8px] font-black text-slate-500 uppercase mb-1">Status</p>
                  <p className={`text-xs font-bold uppercase ${selectedMember.is_active ? 'text-green-500' : 'text-red-500'}`}>
                    {selectedMember.is_active ? 'Active Clearance' : 'Access Revoked'}
                  </p>
                </div>
                <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl overflow-hidden">
                  <p className="text-[8px] font-black text-slate-500 uppercase mb-1">Comm Channel</p>
                  <p className="text-xs font-bold text-white truncate">{selectedMember.email}</p>
                </div>
              </div>

              {/* LOCKED ROLE SECTION IF SUSPENDED */}
              <div className={`p-5 border rounded-2xl transition-all ${!selectedMember.is_active ? 'bg-red-500/5 border-red-500/10 opacity-60' : 'bg-white/[0.02] border-white/5'}`}>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Clearance Level (Role)</label>
                <div className="flex gap-2">
                  <select 
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value)}
                    disabled={!selectedMember.is_active}
                    className="flex-1 bg-[#0a0a0a] border border-white/10 rounded-xl p-3 text-xs font-bold text-white uppercase disabled:cursor-not-allowed appearance-none"
                  >
                    <option value="analyst">Analyst</option>
                    <option value="viewer">Viewer</option>
                    <option value="admin">System Admin</option>
                  </select>
                  <button 
                    onClick={handleUpdateRole}
                    disabled={!selectedMember.is_active || editRole === selectedMember.role}
                    className="px-4 py-3 bg-blue-500/10 text-blue-500 disabled:opacity-30 disabled:cursor-not-allowed border border-blue-500/20 rounded-xl text-[10px] font-black uppercase transition-all"
                  >
                    Update
                  </button>
                </div>
                {!selectedMember.is_active && (
                  <p className="text-[9px] text-red-500/60 font-bold uppercase mt-3 italic text-center">Restore access to modify clearance.</p>
                )}
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-white/5">
              <button 
                onClick={handleToggleAccess}
                className={`w-full py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${
                  selectedMember.is_active ? 'bg-red-500/10 text-red-500 border-red-500/20' : 'bg-green-500/10 text-green-500 border-green-500/20'
                }`}
              >
                {selectedMember.is_active ? 'Revoke System Access' : 'Restore System Access'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* INTEGRATION MODAL */}
      {showIntegrationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-[#0a0a0a] border border-white/10 rounded-[32px] w-full max-w-2xl overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-white/5 flex justify-between items-center">
              <div>
                <h3 className="text-xl font-black italic text-white uppercase">Deploy W-IDS Sensor</h3>
                <p className="text-[10px] text-slate-500 font-bold uppercase mt-1">Workspace API credentials</p>
              </div>
              <button onClick={() => setShowIntegrationModal(false)} className="text-slate-500 hover:text-white"><X size={20} /></button>
            </div>
            <div className="p-6 flex flex-col md:flex-row gap-6">
              <div className="flex flex-col gap-2 w-full md:w-48">
                {['linux', 'windows', 'node', 'python'].map((os) => (
                  <button 
                    key={os}
                    onClick={() => setActiveOsTab(os as any)}
                    className={`px-4 py-3 rounded-xl text-left text-xs font-bold uppercase transition-all ${activeOsTab === os ? 'bg-blue-500/10 text-blue-500 border border-blue-500/20' : 'text-slate-400 hover:bg-white/5'}`}
                  >
                    {os === 'linux' ? 'Linux / Ubuntu' : os === 'windows' ? 'Windows Server' : os === 'node' ? 'Node.js' : 'Python'}
                  </button>
                ))}
              </div>
              <div className="flex-1">
                <div className="bg-black border border-white/10 rounded-2xl p-4 relative">
                  <pre className="text-xs font-mono text-slate-300 overflow-x-auto whitespace-pre-wrap">
                    {activeOsTab === 'linux' && `curl -sSL https://api.w-ids.com/install.sh | bash\nwids-sensor start --api-key="${currentUser?.api_key || 'wids_live_...'}"`}
                    {activeOsTab === 'windows' && `Invoke-WebRequest -Uri "https://api.w-ids.com/install.ps1" -OutFile "install.ps1"\n.\\install.ps1 -ApiKey "${currentUser?.api_key || 'wids_live_...'}"`}
                    {activeOsTab === 'node' && `npm install @w-ids/express-middleware\n\nconst wids = require('@w-ids/express-middleware');\napp.use(wids.protect({ apiKey: '${currentUser?.api_key || 'wids_live_...'}' }));`}
                    {activeOsTab === 'python' && `pip install wids-fastapi\n\nfrom wids import WidsMiddleware\napp.add_middleware(WidsMiddleware, api_key="${currentUser?.api_key || 'wids_live_...'}")`}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// SUB-COMPONENT: Notifications Feed
// Placed in the same file to prevent import errors and keep the code modular.
// ============================================================================

function NotificationsFeed() {
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await api.get('/management/notifications');
      setNotifications(res.data);
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const markAsRead = async (id: number) => {
    try {
      await api.patch(`/management/notifications/${id}/read`);
      setNotifications(prev => 
        prev.map(n => n.id === id ? { ...n, is_read: true } : n)
      );
    } catch (error) {
      console.error("Failed to clear notification:", error);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'security': return <ShieldAlert size={18} className="text-red-500" />;
      case 'system': return <Server size={18} className="text-blue-500" />;
      case 'success': return <CheckCircle size={18} className="text-green-500" />;
      case 'warning': return <AlertTriangle size={18} className="text-orange-500" />;
      default: return <Bell size={18} className="text-slate-500" />;
    }
  };

  if (loading) {
    return (
      <div className="bg-[#0a0a0a] border border-white/5 rounded-[32px] p-8 h-full flex justify-center items-center">
        <div className="w-6 h-6 border-2 border-slate-500/20 border-t-slate-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="bg-[#0a0a0a] border border-white/5 rounded-[32px] p-8 h-full">
      <div className="flex items-center gap-3 mb-8 border-b border-white/5 pb-4">
        <div className="p-3 bg-blue-500/10 rounded-xl text-blue-500">
          <Bell size={20} />
        </div>
        <div>
          <h3 className="text-xl font-black italic text-white uppercase tracking-tight">System Feed</h3>
          <p className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.2em]">Workspace Notifications</p>
        </div>
      </div>

      <div className="space-y-3 max-h-[600px] overflow-y-auto custom-scrollbar pr-2">
        {notifications.map((notif) => (
          <div 
            key={notif.id} 
            className={`p-5 rounded-2xl border transition-all flex items-start justify-between gap-4 ${
              notif.is_read 
                ? 'bg-transparent border-white/5 opacity-60' 
                : 'bg-white/[0.02] border-white/10 shadow-[0_0_15px_rgba(255,255,255,0.02)]'
            }`}
          >
            <div className="flex gap-4">
              <div className="mt-1">
                {getIcon(notif.type)}
              </div>
              <div>
                <h4 className={`text-sm font-bold ${notif.is_read ? 'text-slate-400' : 'text-white'}`}>
                  {notif.title}
                </h4>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  {notif.body}
                </p>
                <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mt-3">
                  {new Date(notif.timestamp).toLocaleString()}
                </p>
              </div>
            </div>

            {!notif.is_read && (
              <button 
                onClick={() => markAsRead(notif.id)}
                className="p-2 hover:bg-white/10 rounded-xl text-slate-400 hover:text-white transition-colors"
                title="Mark as Read"
              >
                <Check size={16} />
              </button>
            )}
          </div>
        ))}

        {notifications.length === 0 && (
          <div className="py-12 text-center border-2 border-dashed border-white/5 rounded-2xl">
            <p className="text-slate-500 font-black uppercase tracking-widest text-[10px]">No recent notifications</p>
          </div>
        )}
      </div>
    </div>
  );
}