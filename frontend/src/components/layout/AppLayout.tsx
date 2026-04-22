// src/components/layout/AppLayout.tsx
import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, ShieldAlert, ShieldCheck, Settings, User, LogOut, Menu, X, Bell, Zap } from 'lucide-react';
import { useAuthStore } from '../../stores/auth.store';
import { useAlertsStore } from '../../stores/alerts.store';
import { useWebSocket } from '../../hooks/useWebSocket';

export const AppLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuthStore();
  const { realtimeAlerts } = useAlertsStore();
  const navigate = useNavigate();
  const location = useLocation();

  // Token kanca içinde store'dan otomatik alınıyor, parametre hatası kalktı
  useWebSocket();

  return (
    <div className="flex h-screen bg-[#050505] text-white overflow-hidden">
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/60 z-[60] md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar - Senin Sevdiğin Tasarım + Responsive Fix */}
      <aside className={`fixed inset-y-0 left-0 z-[70] w-64 bg-[#0a0a0a] border-r border-neutral-900 transform transition-transform duration-300 md:relative md:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex flex-col h-full">
          <div className="p-6 flex items-center justify-between border-b border-neutral-900">
             <span className="font-black text-xl italic text-blue-500 uppercase tracking-tighter">W-NIDS</span>
             <button className="md:hidden" onClick={() => setSidebarOpen(false)}><X /></button>
          </div>

          <nav className="flex-1 p-4 space-y-1">
            <Link to="/dashboard" className={`flex items-center gap-3 p-3 rounded-lg ${location.pathname === '/dashboard' ? 'bg-blue-600/10 text-blue-500' : 'text-neutral-500 hover:text-white'}`}>
              <LayoutDashboard size={18} /> Overview
            </Link>
            <Link to="/intrusions" className={`flex items-center gap-3 p-3 rounded-lg ${location.pathname === '/intrusions' ? 'bg-blue-600/10 text-blue-500' : 'text-neutral-500 hover:text-white'}`}>
              <ShieldAlert size={18} /> Intrusions
            </Link>
            <Link to="/intelligence" className={`flex items-center gap-3 p-3 rounded-lg ${location.pathname === '/intelligence' ? 'bg-blue-600/10 text-blue-500' : 'text-neutral-500 hover:text-white'}`}>
              <Zap size={18} /> Intelligence
            </Link>
            <Link to="/defense" className={`flex items-center gap-3 p-3 rounded-lg ${location.pathname === '/defense' ? 'bg-blue-600/10 text-blue-500' : 'text-neutral-500 hover:text-white'}`}>
              <ShieldCheck size={18} /> Defense
            </Link>
            <Link to="/management" className={`flex items-center gap-3 p-3 rounded-lg ${location.pathname === '/management' ? 'bg-blue-600/10 text-blue-500' : 'text-neutral-500 hover:text-white'}`}>
              <Settings size={18} /> Management
            </Link>
          </nav>

          {/* Alt Profil Kısmı - Hatasız Versiyon */}
          <div className="p-4 border-t border-neutral-900">
            <Link to="/profile" className="flex items-center gap-3 p-2 hover:bg-neutral-900 rounded-xl transition-colors">
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center font-bold">
                {user?.email?.[0]?.toUpperCase() || 'U'}
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-bold truncate">{user?.email || 'Loading...'}</p>
                <p className="text-[10px] text-neutral-500 uppercase">{user?.role || 'Guest'}</p>
              </div>
            </Link>
            <button onClick={() => { logout(); navigate('/login'); }} className="flex items-center gap-3 p-3 mt-2 w-full text-red-500 hover:bg-red-500/10 rounded-lg text-sm">
              <LogOut size={16} /> Logout
            </button>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b border-neutral-900 flex items-center justify-between px-6 bg-black/50 backdrop-blur">
          <button className="md:hidden" onClick={() => setSidebarOpen(true)}><Menu /></button>
          
          <div className="flex items-center gap-4 ml-auto">
            {/* Bildirim İkonu */}
            <button onClick={() => navigate('/notifications')} className="relative p-2 text-neutral-400 hover:text-white">
              <Bell size={20} />
              {realtimeAlerts.length > 0 && <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full ring-2 ring-black" />}
            </button>

            <Link to="/profile" className="flex items-center gap-2 pl-4 border-l border-neutral-800">
              <span className="text-xs font-mono text-neutral-400">
                {/* HATA ÇÖZÜMÜ: split öncesi user.email kontrolü */}
                {user?.email ? user.email.split('@')[0].toUpperCase() : 'USER'}
              </span>
              <User size={18} className="text-neutral-500" />
            </Link>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};