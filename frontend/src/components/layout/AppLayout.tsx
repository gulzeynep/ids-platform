// src/components/layout/AppLayout.tsx
import React from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, ShieldAlert, ShieldCheck, Settings, 
  Bell, User, PanelLeftClose, PanelLeftOpen, Fingerprint,
  Zap, LogOut, Activity
} from 'lucide-react';
import { useAuthStore } from '../../stores/auth.store';
import { useAlertsStore } from '../../stores/alerts.store';
import { useWebSocket } from '../../hooks/useWebSocket';
import { useUIStore } from '../../stores/ui.store';

export const AppLayout = () => {
  const { sidebarOpen, toggleSidebar } = useUIStore(); 
  const { user, logout } = useAuthStore();
  const { realtimeAlerts, isWsConnected } = useAlertsStore();
  
  const location = useLocation();
  const navigate = useNavigate();

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
      
      {/* ================= SIDEBAR (NO HOVER) ================= */}
      <aside 
        className={`flex flex-col bg-[#080808] border-r border-white/5 transition-all duration-300 ease-in-out flex-shrink-0 z-50 ${sidebarOpen ? 'w-64' : 'w-20'}`}
      >
        {/* LOGO BÖLÜMÜ */}
        <Link to="/dashboard" className={`h-16 flex items-center px-6 hover:bg-white/5 transition-colors whitespace-nowrap overflow-hidden ${sidebarOpen ? 'justify-start' : 'justify-center px-0'}`}>
          <div className="flex items-center gap-3">
            <div className="min-w-[32px] h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-600/20">
              <Fingerprint size={18} />
            </div>
            <span className={`font-black italic text-lg tracking-tighter uppercase transition-opacity duration-300 ${sidebarOpen ? 'opacity-100' : 'opacity-0 hidden'}`}>
              W-IDS
            </span>
          </div>
        </Link>

        {/* AÇ-KAPA (PIN) BUTONU - HİZALAMA DÜZELTİLDİ */}
        <div className={`flex items-center px-4 py-2 border-b border-white/5 ${sidebarOpen ? 'justify-start' : 'justify-center'}`}>
          <button 
            onClick={toggleSidebar}
            className={`p-1.5 rounded-lg border transition-all shadow-inner ${sidebarOpen ? 'bg-blue-600/20 border-blue-500/50 text-blue-400' : 'bg-transparent border-transparent text-neutral-500 hover:bg-white/5 hover:text-white'}`}
            title={sidebarOpen ? "Close Sidebar" : "Open Sidebar"}
          >
            {sidebarOpen ? <PanelLeftClose size={16} /> : <PanelLeftOpen size={16} />}
          </button>
        </div>

        <div className="flex-1 py-6 px-3 space-y-8 overflow-y-auto overflow-x-hidden scrollbar-hide">
          <div className="space-y-1">
            <NavItem to="/dashboard" icon={<LayoutDashboard size={20} />} label="Dashboard" expanded={sidebarOpen} active={location.pathname === '/dashboard'} />
            <NavItem to="/intelligence" icon={<Zap size={20} />} label="Intelligence" expanded={sidebarOpen} active={location.pathname === '/intelligence'} />
          </div>

          <div className="h-px bg-white/5 mx-2" />

          <div className="space-y-1">
            {sidebarOpen && <p className="px-4 text-[10px] font-bold text-neutral-600 uppercase tracking-[0.2em] mb-2 whitespace-nowrap">Security</p>}
            <NavItem to="/intrusions" icon={<ShieldAlert size={20} />} label="Intrusions" expanded={sidebarOpen} active={location.pathname === '/intrusions'} />
            <NavItem to="/defense" icon={<ShieldCheck size={20} />} label="Defense" expanded={sidebarOpen} active={location.pathname === '/defense'} />
          </div>

          <div className="h-px bg-white/5 mx-2" />

          <div className="space-y-1">
            <NavItem to="/management" icon={<Activity size={20} />} label="Management" expanded={sidebarOpen} active={location.pathname === '/management'} />
            <NavItem to="/settings" icon={<Settings size={20} />} label="Settings" expanded={sidebarOpen} active={location.pathname === '/settings'} />
          </div>
        </div>

        <div className="p-4 border-t border-white/5">
          <button onClick={() => { logout(); navigate('/login'); }} className={`w-full flex items-center p-3 rounded-xl text-red-500 hover:bg-red-500/10 transition-all whitespace-nowrap overflow-hidden ${sidebarOpen ? 'justify-start gap-4' : 'justify-center'}`}>
            <LogOut size={20} className="flex-shrink-0" />
            <span className={`text-xs font-bold uppercase tracking-tight transition-opacity duration-300 ${sidebarOpen ? 'opacity-100' : 'opacity-0 hidden'}`}>Logout</span>
          </button>
        </div>
      </aside>

      {/* ================= MAIN CONTENT AREA ================= */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 z-30 border-b border-white/5 bg-black/40 backdrop-blur-md flex items-center justify-between px-8">
          <div className="flex items-center gap-4">            
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold tracking-tight text-white uppercase italic">{currentTitle}</h2>
                <span 
                  className={`w-2 h-2 rounded-full shadow-lg ${isWsConnected ? 'bg-green-500 shadow-green-500/50' : 'bg-red-500 shadow-red-500/50 animate-pulse'}`} 
                  title={isWsConnected ? "SOC Stream Active" : "SOC Stream Disconnected"}
                />
              </div>
              <p className="text-[9px] text-blue-500 font-mono tracking-widest uppercase opacity-70 italic">Core_Secure // {user?.role || 'Guest'}</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative group">
              <Link to="/notifications" className="block p-2.5 rounded-xl bg-white/5 border border-white/5 hover:border-blue-500/30 text-neutral-400 transition-all">
                <Bell size={18} />
                {realtimeAlerts.length > 0 && <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-[#020202] animate-pulse" />}
              </Link>
            </div>
            
            <div className="h-6 w-px bg-white/10 mx-2" />

            <div className="relative group">
              <Link to="/profile" className="flex items-center gap-3">
                <div className="text-right hidden sm:block">
                  <p className="text-xs font-bold text-white group-hover:text-blue-400 transition-colors">
                    {user?.full_name || user?.email?.split('@')[0].toUpperCase() || 'USER'}
                  </p>
                  <p className="text-[9px] text-neutral-500 font-mono uppercase">Personnel_Profile</p>
                </div>
                <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:border-blue-500/50 transition-all">
                  <User size={18} className="text-blue-500" />
                </div>
              </Link>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <div className="max-w-7xl mx-auto"><Outlet /></div>
        </main>
      </div>
    </div>
  );
};

const NavItem = ({ to, icon, label, expanded, active }: { to: string, icon: React.ReactNode, label: string, expanded: boolean, active: boolean }) => (
  <Link to={to} className={`
    flex items-center py-3 rounded-2xl transition-all group relative whitespace-nowrap overflow-hidden
    ${expanded ? 'justify-start gap-4 px-4' : 'justify-center px-0'}
    ${active ? 'bg-blue-600 text-white shadow-xl shadow-blue-600/20' : 'text-neutral-500 hover:bg-white/5 hover:text-white'}
  `}>
    <div className={`flex-shrink-0 ${active ? 'scale-110' : 'group-hover:scale-110'} transition-transform duration-300`}>
      {icon}
    </div>
    
    <span className={`font-bold text-sm tracking-tight transition-opacity duration-300 ${expanded ? 'opacity-100' : 'opacity-0 hidden'}`}>
      {label}
    </span>
    
    {!expanded && (
      <div className="absolute left-16 bg-blue-600 text-white px-3 py-1.5 rounded-lg text-[10px] opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-[100] shadow-2xl uppercase font-bold tracking-tighter">
        {label}
      </div>
    )}
  </Link>
);
