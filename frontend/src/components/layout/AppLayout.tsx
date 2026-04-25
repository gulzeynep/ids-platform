// src/components/layout/AppLayout.tsx
import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, ShieldAlert, ShieldCheck, Settings, 
  Bell, User, PanelLeftClose, PanelLeftOpen, Fingerprint,
  Zap, LogOut, Activity 
} from 'lucide-react';
import { useAuthStore } from '../../stores/auth.store';
import { useAlertsStore } from '../../stores/alerts.store';
import { useWebSocket } from '../../hooks/useWebSocket';

export const AppLayout = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { realtimeAlerts } = useAlertsStore();

  useWebSocket();

  const currentTitle = {
    '/dashboard': 'Overview',
    '/intelligence': 'Intelligence',
    '/intrusions': 'Detection',
    '/defense': 'Defense',
    '/management': 'System',
    '/settings': 'Settings'
  }[location.pathname] || 'Command Center';

  return (
    <div className="flex h-screen bg-[#020202] text-white overflow-hidden font-sans">
      {/* SIDEBAR */}
      <aside className={`relative flex flex-col bg-[#080808] border-r border-white/5 transition-all duration-300 ease-in-out flex-shrink-0 ${isCollapsed ? 'w-20' : 'w-64'}`}>
        
        <div className="h-20 flex items-center px-6 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="min-w-[32px] h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-600/20">
              <Fingerprint size={18} />
            </div>
            {!isCollapsed && <span className="font-black italic text-lg tracking-tighter uppercase animate-in fade-in">W-IDS</span>}
          </div>
        </div>

        {/* Gruplandırılmış Navigasyon - Scroll Problemi Çözüldü */}
        <div className="flex-1 py-6 px-3 space-y-8 overflow-y-auto overflow-x-hidden scrollbar-hide">
          <div className="space-y-1">
            <NavItem to="/dashboard" icon={<LayoutDashboard size={20} />} label="Dashboard" collapsed={isCollapsed} active={location.pathname === '/dashboard'} />
            <NavItem to="/intelligence" icon={<Zap size={20} />} label="Intelligence" collapsed={isCollapsed} active={location.pathname === '/intelligence'} />
          </div>

          <div className="h-px bg-white/5 mx-2" />

          <div className="space-y-1">
            {!isCollapsed && <p className="px-4 text-[10px] font-bold text-neutral-600 uppercase tracking-[0.2em] mb-2">Security</p>}
            <NavItem to="/intrusions" icon={<ShieldAlert size={20} />} label="Intrusions" collapsed={isCollapsed} active={location.pathname === '/intrusions'} />
            <NavItem to="/defense" icon={<ShieldCheck size={20} />} label="Defense" collapsed={isCollapsed} active={location.pathname === '/defense'} />
          </div>

          <div className="h-px bg-white/5 mx-2" />

          <div className="space-y-1">
            <NavItem to="/management" icon={<Activity size={20} />} label="Management" collapsed={isCollapsed} active={location.pathname === '/management'} />
            <NavItem to="/settings" icon={<Settings size={20} />} label="Settings" collapsed={isCollapsed} active={location.pathname === '/settings'} />
          </div>
        </div>

        <div className="p-4 border-t border-white/5">
          <button onClick={() => { logout(); navigate('/login'); }} className="w-full flex items-center gap-4 p-3 rounded-xl text-red-500 hover:bg-red-500/10 transition-all">
            <LogOut size={20} />
            {!isCollapsed && <span className="text-xs font-bold uppercase tracking-tight">Logout</span>}
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b border-white/5 bg-black/40 backdrop-blur-md flex items-center justify-between px-8">
          <div className="flex items-center gap-4">
            {/* Optimize edilmiş daraltma butonu */}
            <button 
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="p-1.5 rounded-lg bg-white/5 border border-white/10 text-neutral-400 hover:text-white transition-all shadow-inner"
            >
              {isCollapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
            </button>
            <div>
              <h2 className="text-sm font-bold tracking-tight text-white uppercase italic">{currentTitle}</h2>
              <p className="text-[9px] text-blue-500 font-mono tracking-widest uppercase opacity-70 italic">Core_Secure // {user?.role || 'Guest'}</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Link to="/notifications" className="p-2.5 rounded-xl bg-white/5 border border-white/5 hover:border-blue-500/30 text-neutral-400 relative transition-all">
              <Bell size={18} />
              {realtimeAlerts.length > 0 && <span className="absolute top-2.5 right-2.5 w-1.5 h-1.5 bg-red-500 rounded-full border border-black animate-pulse" />}
            </Link>
            
            <div className="h-6 w-px bg-white/10 mx-2" />

            <Link to="/profile" className="flex items-center gap-3 group">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-bold text-white group-hover:text-blue-400 transition-colors">
                  {user?.email ? user.email.split('@')[0].toUpperCase() : 'USER'}
                </p>
                <p className="text-[9px] text-neutral-500 font-mono uppercase">Personnel_Profile</p>
              </div>
              <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:border-blue-500/50 transition-all">
                <User size={18} className="text-blue-500" />
              </div>
            </Link>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <div className="max-w-7xl mx-auto"><Outlet /></div>
        </main>
      </div>
    </div>
  );
};

const NavItem = ({ to, icon, label, collapsed, active }: any) => (
  <Link to={to} className={`
    flex items-center gap-4 p-3 rounded-2xl transition-all group relative
    ${active ? 'bg-blue-600 text-white shadow-xl shadow-blue-600/20' : 'text-neutral-500 hover:bg-white/5 hover:text-white'}
  `}>
    <div className={`${active ? 'scale-110' : 'group-hover:scale-110'} transition-transform duration-300`}>
      {icon}
    </div>
    {!collapsed && <span className="font-bold text-sm tracking-tight">{label}</span>}
    {collapsed && (
      <div className="absolute left-16 bg-blue-600 text-white px-3 py-1.5 rounded-lg text-[10px] opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-[100] shadow-2xl uppercase font-bold tracking-tighter">
        {label}
      </div>
    )}
  </Link>
);