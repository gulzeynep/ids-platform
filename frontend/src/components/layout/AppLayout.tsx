// src/components/layout/AppLayout.tsx
import { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, ShieldAlert, Activity, ShieldBan, Settings, UserCircle, LogOut, Menu, X } from 'lucide-react';
import { Toaster } from 'sonner'; 
// Not: store import yolun src/stores/... şeklinde olmalı
import { useAuthStore } from '../../stores/auth.store'; 
import { useWebSocket } from '../../hooks/useWebSocket';

export const AppLayout = () => {
    const location = useLocation();
    
    const { logout } = useAuthStore();

    const [isMobileOpen, setIsMobileOpen] = useState(false);

    // WebSocket bağlantısını başlatıyoruz
    useWebSocket({ enabled: true });

    useEffect(() => {
        setIsMobileOpen(false);
    }, [location.pathname]);

    const navLinkClass = ({ isActive }: { isActive: boolean }) => 
        `flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
            isActive ? 'bg-blue-600/10 text-blue-500 border border-blue-500/20' : 'text-neutral-400 hover:bg-neutral-900 hover:text-white'
        }`;

    return (
        <div className="min-h-screen bg-[#050505] text-neutral-200 flex font-sans selection:bg-blue-500/30">
            <Toaster theme="dark" position="bottom-right" richColors closeButton />

            {/* SIDEBAR */}
            <aside className={`bg-[#0a0a0a] border-r border-neutral-900 flex flex-col transition-transform duration-300 z-50
                ${isMobileOpen ? 'translate-x-0 fixed inset-y-0 left-0 w-64' : '-translate-x-full fixed inset-y-0 left-0 w-64 md:relative md:translate-x-0'}`
            }>
                <div className="p-6 border-b border-neutral-900 flex justify-between items-center">
                    <h1 className="text-blue-500 font-bold text-2xl tracking-wider italic flex items-center gap-2">
                        <ShieldAlert className="w-6 h-6" /> W-IDS
                    </h1>
                    <button className="md:hidden text-neutral-400" onClick={() => setIsMobileOpen(false)}>
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <nav className="flex-1 px-4 py-6 space-y-2">
                    <p className="px-4 text-xs font-semibold text-neutral-600 uppercase tracking-wider mb-2">Analytics</p>
                    <NavLink to="/dashboard" className={navLinkClass}><LayoutDashboard className="w-5 h-5" /> Overview</NavLink>
                    <NavLink to="/intelligence" className={navLinkClass}><Activity className="w-5 h-5" /> Intelligence</NavLink>

                    <p className="px-4 text-xs font-semibold text-neutral-600 uppercase tracking-wider mt-8 mb-2">Operations</p>
                    <NavLink to="/intrusions" className={navLinkClass}><ShieldAlert className="w-5 h-5" /> Intrusions</NavLink>
                    <NavLink to="/defense" className={navLinkClass}><ShieldBan className="w-5 h-5" /> Defense</NavLink>
                </nav>

                <div className="p-4 border-t border-neutral-900 space-y-2">
                    <NavLink to="/management" className={navLinkClass}><UserCircle className="w-5 h-5" /> Management</NavLink>
                    <NavLink to="/settings" className={navLinkClass}><Settings className="w-5 h-5" /> Settings</NavLink>
                    <button onClick={logout} className="w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium text-neutral-400 hover:bg-red-950/30 hover:text-red-500 transition-colors">
                        <LogOut className="w-5 h-5" /> Disconnect
                    </button>
                </div>
            </aside>

            {/* Mobile menu background overlay */}
            {isMobileOpen && <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setIsMobileOpen(false)} />}

            {/* MOBILE HEADER */}
            <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-[#0a0a0a] border-b border-neutral-900 flex items-center justify-between px-4 z-30">
                <h1 className="text-blue-500 font-bold text-xl italic flex items-center gap-2">
                    <ShieldAlert className="w-5 h-5" /> W-IDS
                </h1>
                <button onClick={() => setIsMobileOpen(true)}>
                    <Menu className="w-6 h-6 text-neutral-400 hover:text-white" />
                </button>
            </div>

            {/* MAIN CONTENT AREA */}
            <main className="flex-1 md:p-8 p-4 mt-16 md:mt-0 overflow-x-hidden">
                <Outlet />
            </main>
        </div>
    );
};