import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { Shield, LayoutDashboard, Search, Bell, Settings, User, LogOut, Menu } from 'lucide-react';
import { useAuthStore } from '../lib/store';

const Layout = () => {
  const logout = useAuthStore((state) => state.logout);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { path: '/overview', label: 'Overview', icon: LayoutDashboard },
    { path: '/analysis', label: 'Analysis', icon: Search },
    { path: '/intrusions', label: 'Intrusions', icon: Bell },
    { path: '/management', label: 'Team', icon: User },
    { path: '/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="flex min-h-screen bg-slate-950">
      {/* SIDEBAR */}
      <aside className="w-64 bg-slate-900 border-r border-slate-800 hidden md:flex flex-col">
        <div className="p-6 flex items-center gap-3">
          <Shield className="text-blue-500 w-8 h-8" />
          <span className="text-lg font-bold text-white uppercase tracking-widest">W-IDS</span>
        </div>
        
        <nav className="flex-1 px-4 space-y-2 mt-4">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                location.pathname === item.path 
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' 
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-3 text-red-400 hover:bg-red-500/10 rounded-xl transition-all"
          >
            <LogOut className="w-5 h-5" />
            Logout Session
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col">
        <header className="h-16 border-b border-slate-800 bg-slate-900/50 backdrop-blur-md px-8 flex items-center justify-between sticky top-0 z-10">
          <div className="md:hidden"><Menu className="text-white" /></div>
          <div className="text-slate-400 text-sm font-medium">Workspace: <span className="text-blue-400 font-mono">SEC-TERMINAL-01</span></div>
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center">
              <User className="w-4 h-4 text-slate-400" />
            </div>
          </div>
        </header>
        
        <div className="p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Layout;