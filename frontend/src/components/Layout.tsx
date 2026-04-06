import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { Shield, Activity, Search, AlertTriangle, Users, Settings, LogOut, Mail, User as UserIcon } from 'lucide-react';

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const menuItems = [
    { path: '/overview', name: 'Overview', icon: <Activity size={16} /> },
    { path: '/analysis', name: 'Analysis', icon: <Search size={16} /> },
    { path: '/intrusions', name: 'Intrusions', icon: <AlertTriangle size={16} /> },
    { path: '/users', name: 'User Panel', icon: <Users size={16} /> },
    { path: '/settings', name: 'Settings', icon: <Settings size={16} /> },
    { path: '/contact', name: 'Contact', icon: <Mail size={16} /> },
  ];

  return (
    <div className="min-h-screen bg-[#050505] text-slate-200 font-sans selection:bg-blue-500/30">
      
      {/* ÜST MENÜ (NAVBAR) */}
      <nav className="border-b border-white/5 bg-black/50 backdrop-blur-md sticky top-0 z-50 h-16 flex items-center px-6 justify-between">
        
        {/* Sol Kısım: Logo ve Menüler */}
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/overview')}>
            <Shield className="text-blue-500 w-6 h-6" />
            <h1 className="font-black italic text-lg uppercase tracking-tighter hidden md:block">W-IDS CORE</h1>
          </div>
          
          <div className="hidden md:flex items-center gap-2">
            {menuItems.map((item) => {
              const isActive = location.pathname.startsWith(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-all font-bold text-[11px] uppercase tracking-wider ${
                    isActive 
                      ? 'bg-blue-500/10 text-blue-500 border border-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.1)]' 
                      : 'text-slate-500 hover:text-white hover:bg-white/5 border border-transparent'
                  }`}
                >
                  {item.icon}
                  {item.name}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Sağ Kısım: Profil ve Çıkış */}
        <div className="flex items-center gap-2">
          <Link to="/users" className="p-2 text-slate-500 hover:text-white transition-colors rounded-lg hover:bg-white/5">
            <UserIcon size={18}/>
          </Link>
          <button onClick={handleLogout} className="p-2 text-slate-500 hover:text-red-500 transition-colors rounded-lg hover:bg-red-500/10">
            <LogOut size={18} />
          </button>
        </div>
      </nav>

      {/* SAYFA İÇERİĞİ (DEĞİŞEN KISIM) */}
      <main className="relative">
        <Outlet />
      </main>
      
    </div>
  );
}