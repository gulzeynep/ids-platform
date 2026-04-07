import { useEffect, useState, useCallback } from 'react';
import { 
  Users, UserPlus, Shield, Settings, Bell, 
  ShieldAlert, Server, CheckCircle, AlertTriangle, Check 
} from 'lucide-react';
import api from '../lib/api';

// --- INTERFACES ---
interface User {
  id: number;
  email: string;
  role: string;
  is_active: boolean;
  full_name?: string;
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
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [teamMembers, setTeamMembers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // --- FETCH DATA ---
  const fetchData = useCallback(async () => {
    try {
      // 1. Get current user to check if they are an admin
      const userRes = await api.get('/auth/me');
      setCurrentUser(userRes.data);

      // 2. Fetch team members 
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
              
              {/* Only Admins can deploy operatives */}
              {currentUser?.role === 'admin' && (
                <button className="px-5 py-2.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-500 border border-blue-500/20 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-[0_0_15px_rgba(37,99,235,0.1)] flex items-center gap-2">
                  <UserPlus size={14} /> Deploy Operative
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {teamMembers.map((member) => (
                <div key={member.id} className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl flex items-center gap-4 hover:border-white/10 transition-colors">
                  <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-500">
                    <Shield size={20} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white truncate max-w-[150px]">{member.email}</h4>
                    <div className="flex gap-2 mt-1">
                      <span className="text-[8px] font-black text-blue-400 uppercase tracking-widest bg-blue-500/10 px-2 py-0.5 rounded">
                        {member.role}
                      </span>
                      {member.is_active && (
                        <span className="text-[8px] font-black text-green-400 uppercase tracking-widest bg-green-500/10 px-2 py-0.5 rounded">
                          Active
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {teamMembers.length === 0 && (
                <div className="col-span-2 py-8 text-center text-slate-500 text-xs italic">
                  No operatives found in this workspace.
                </div>
              )}
            </div>
          </div>

          {/* System Settings Section */}
          <div className="bg-[#0a0a0a] border border-white/5 rounded-[32px] p-8">
            <div className="flex items-center gap-2 mb-6">
              <Settings size={20} className="text-slate-400"/>
              <h3 className="text-xl font-black italic text-white uppercase tracking-tight">Security Preferences</h3>
            </div>
            
            <div className="space-y-4">
              <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl flex justify-between items-center">
                <div>
                  <h4 className="text-sm font-bold text-white">Critical Email Alerts</h4>
                  <p className="text-xs text-slate-500">Receive an email when severity is CRITICAL</p>
                </div>
                <div className="w-12 h-6 bg-blue-500 rounded-full relative cursor-pointer shadow-[0_0_10px_rgba(37,99,235,0.3)]">
                  <div className="w-4 h-4 bg-white rounded-full absolute right-1 top-1"></div>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* --- RIGHT COLUMN: NOTIFICATIONS FEED --- */}
        <div className="w-full xl:w-[450px]">
          <NotificationsFeed />
        </div>

      </div>
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