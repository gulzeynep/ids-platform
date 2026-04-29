// src/components/layout/AppLayout.tsx
import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, ShieldAlert, ShieldCheck, Settings, 
  Bell, User, PanelLeftClose, PanelLeftOpen, Fingerprint,
  Zap, LogOut, Activity, Mail, Hash
} from 'lucide-react';
import { useAuthStore } from '../../stores/auth.store';
import { useAlertsStore } from '../../stores/alerts.store';
import { useWebSocket } from '../../hooks/useWebSocket';
import { useUIStore } from '../../stores/ui.store';

export const AppLayout = () => {
  // Zustand Global States
  const { sidebarOpen, toggleSidebar } = useUIStore(); // Pin (Sabitleme) durumu
  const { user, logout } = useAuthStore();
  const { realtimeAlerts, isWsConnected } = useAlertsStore();
  
  // Local State
  const [isHovered, setIsHovered] = useState(false); // Mouse üzerine gelme durumu

  const location = useLocation();
  const navigate = useNavigate();

  // Sidebar'ın gerçek görünürlük durumu: Ya kilitlidir ya da mouse üzerindedir
  const isExpanded = sidebarOpen || isHovered;
  
  // WebSocket'i başlat
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
      
      {/* ================= SIDEBAR ================= */}
      <aside 
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`relative flex flex-col bg-[#080808] border-r border-white/5 transition-all duration-300 ease-in-out flex-shrink-0 z-40 ${isExpanded ? 'w-64' : 'w-20'}`}
      >
        
        {/* LOGO (Tıklanabilir) */}
        <Link to="/dashboard" className="h-20 flex items-center px-6 border-b border-white/5 hover:bg-white/5 transition-colors">
          <div className="flex items-center gap-3">
            <div className="min-w-[32px] h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-600/20">
              <Fingerprint size={18} />
            </div>
            {isExpanded && <span className="font-black italic text-lg tracking-tighter uppercase animate-in fade-in">W-IDS</span>}
          </div>
        </Link>

        {/* MENÜ LİNKLERİ */}
        <div className="flex-1 py-6 px-3 space-y-8 overflow-y-auto overflow-x-hidden scrollbar-hide">
          <div className="space-y-1">
            <NavItem to="/dashboard" icon={<LayoutDashboard size={20} />} label="Dashboard" expanded={isExpanded} active={location.pathname === '/dashboard'} />
            <NavItem to="/intelligence" icon={<Zap size={20} />} label="Intelligence" expanded={isExpanded} active={location.pathname === '/intelligence'} />
          </div>

          <div className="h-px bg-white/5 mx-2" />

          <div className="space-y-1">
            {isExpanded && <p className="px-4 text-[10px] font-bold text-neutral-600 uppercase tracking-[0.2em] mb-2">Security</p>}
            <NavItem to="/intrusions" icon={<ShieldAlert size={20} />} label="Intrusions" expanded={isExpanded} active={location.pathname === '/intrusions'} />
            <NavItem to="/defense" icon={<ShieldCheck size={20} />} label="Defense" expanded={isExpanded} active={location.pathname === '/defense'} />
          </div>

          <div className="h-px bg-white/5 mx-2" />

          <div className="space-y-1">
            <NavItem to="/management" icon={<Activity size={20} />} label="Management" expanded={isExpanded} active={location.pathname === '/management'} />
            <NavItem to="/settings" icon={<Settings size={20} />} label="Settings" expanded={isExpanded} active={location.pathname === '/settings'} />
          </div>
        </div>

        {/* LOGOUT */}
        <div className="p-4 border-t border-white/5">
          <button onClick={() => { logout(); navigate('/login'); }} className="w-full flex items-center gap-4 p-3 rounded-xl text-red-500 hover:bg-red-500/10 transition-all">
            <LogOut size={20} />
            {isExpanded && <span className="text-xs font-bold uppercase tracking-tight">Logout</span>}
          </button>
        </div>
      </aside>

      {/* ================= MAIN CONTENT AREA ================= */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* HEADER */}
        <header className="h-16 z-30 border-b border-white/5 bg-black/40 backdrop-blur-md flex items-center justify-between px-8">
          <div className="flex items-center gap-4">
            
            {/* PIN (SABİTLEME) BUTONU */}
            <button 
              onClick={toggleSidebar}
              className={`p-1.5 rounded-lg border transition-all shadow-inner ${sidebarOpen ? 'bg-blue-600/20 border-blue-500/50 text-blue-400' : 'bg-white/5 border-white/10 text-neutral-400 hover:text-white'}`}
              title={sidebarOpen ? "Unpin Sidebar" : "Pin Sidebar"}
            >
              {sidebarOpen ? <PanelLeftClose size={18} /> : <PanelLeftOpen size={18} />}
            </button>
            
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold tracking-tight text-white uppercase italic">{currentTitle}</h2>
                {/* CANLI WS DURUM IŞIĞI */}
                <span 
                  className={`w-2 h-2 rounded-full shadow-lg ${isWsConnected ? 'bg-green-500 shadow-green-500/50' : 'bg-red-500 shadow-red-500/50 animate-pulse'}`} 
                  title={isWsConnected ? "SOC Stream Active" : "SOC Stream Disconnected"}
                />
              </div>
              <p className="text-[9px] text-blue-500 font-mono tracking-widest uppercase opacity-70 italic">Core_Secure // {user?.role || 'Guest'}</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            
            {/* BİLDİRİMLER (HOVER MENÜ İLE) */}
            <div className="relative group">
              <Link to="/notifications" className="block p-2.5 rounded-xl bg-white/5 border border-white/5 hover:border-blue-500/30 text-neutral-400 transition-all">
                <Bell size={18} />
                {realtimeAlerts.length > 0 && <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-[#020202] animate-pulse" />}
              </Link>
              {/* Bildirim Tooltip */}
              <div className="absolute right-0 top-full mt-2 w-48 bg-[#0a0a0a] border border-white/10 rounded-xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 p-3">
                <p className="text-xs font-bold text-white mb-1">Alerts</p>
                <p className="text-[10px] text-neutral-400">{realtimeAlerts.length > 0 ? `${realtimeAlerts.length} new realtime alerts detected.` : 'No new anomalies detected.'}</p>
              </div>
            </div>
            
            <div className="h-6 w-px bg-white/10 mx-2" />

            {/* KULLANICI PROFİLİ (HOVER MENÜ İLE) */}
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

              {/* Profil Açılır Bilgi Kartı (Tooltip) */}
              <div className="absolute right-0 top-full mt-2 w-56 bg-[#0a0a0a] border border-white/10 rounded-xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 p-4">
                <div className="flex items-center gap-3 mb-3 pb-3 border-b border-white/5">
                  <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                    <User size={20} className="text-blue-500" />
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-sm font-bold text-white truncate">{user?.full_name || 'System Operator'}</p>
                    <p className="text-[10px] text-blue-400 uppercase tracking-widest">{user?.role}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-neutral-400">
                    <Mail size={12} />
                    <span className="text-[10px] truncate">{user?.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-neutral-400">
                    <Hash size={12} />
                    <span className="text-[10px] font-mono truncate">ID: {user?.id}</span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </header>

        {/* ROUTER OUTLET (İÇERİK) */}
        <main className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <div className="max-w-7xl mx-auto"><Outlet /></div>
        </main>
      </div>
    </div>
  );
};


const NavItem = ({ to, icon, label, expanded, active }: { to: string, icon: React.ReactNode, label: string, expanded: boolean, active: boolean }) => (
  <Link to={to} className={`
    flex items-center gap-4 p-3 rounded-2xl transition-all group relative
    ${active ? 'bg-blue-600 text-white shadow-xl shadow-blue-600/20' : 'text-neutral-500 hover:bg-white/5 hover:text-white'}
  `}>
    <div className={`${active ? 'scale-110' : 'group-hover:scale-110'} transition-transform duration-300`}>
      {icon}
    </div>
    
    {expanded && <span className="font-bold text-sm tracking-tight">{label}</span>}
    
    {/* Sidebar kapalıyken ikon üstüne gelince çıkan minik yazı */}
    {!expanded && (
      <div className="absolute left-16 bg-blue-600 text-white px-3 py-1.5 rounded-lg text-[10px] opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-[100] shadow-2xl uppercase font-bold tracking-tighter">
        {label}
      </div>
    )}
  </Link>
);