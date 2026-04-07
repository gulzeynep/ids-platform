import { useEffect, useState, useCallback } from 'react';
import { Bell, ShieldAlert, Server, CheckCircle, AlertTriangle, Check } from 'lucide-react';
import api from '../lib/api';

interface NotificationData {
  id: number;
  title: string;
  body: string;
  type: string;
  is_read: boolean;
  timestamp: string;
}

export default function NotificationsFeed() {
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
      // Update local state to feel instant
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
    return <div className="p-8 text-center text-slate-500 text-xs font-black uppercase">Loading Feed...</div>;
  }

  return (
    <div className="bg-[#0a0a0a] border border-white/5 rounded-[32px] p-8">
      <div className="flex items-center gap-3 mb-8 border-b border-white/5 pb-4">
        <div className="p-3 bg-blue-500/10 rounded-xl text-blue-500">
          <Bell size={20} />
        </div>
        <div>
          <h3 className="text-xl font-black italic text-white uppercase tracking-tight">System Feed</h3>
          <p className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.2em]">Workspace Notifications</p>
        </div>
      </div>

      <div className="space-y-3">
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