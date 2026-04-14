import { useState } from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { 
  Shield, Activity, Search, AlertTriangle, Users, 
  LogOut, Menu, X, Mail, ChevronRight, Sliders, User as UserIcon 
} from 'lucide-react';

export default function Layout() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

    const menuItems = [
    { path: '/overview', name: 'Overview', icon: <Activity size={18} /> },
    { path: '/analysis', name: 'Analysis', icon: <Search size={18} /> },
    { path: '/intrusions', name: 'Intrusions', icon: <AlertTriangle size={18} /> },
    { path: '/management', name: 'Management', icon: <Users size={18} /> }, // Path düzeltildi
    { path: '/contact', name: 'Contact', icon: <Mail size={18} /> },
    ];

  return (
    <div className="min-h-screen bg-[#050505] text-slate-200 font-sans">
      
      {/* TOP NAVBAR */}
      <nav className="border-b border-white/5 bg-black/80 backdrop-blur-xl sticky top-0 z-[100] h-16 flex items-center px-6 justify-between">
        <div className="flex items-center gap-4">
            
          {/* HAMBURGER - Sadece Mobil/Tablet ekranda görünür */}
          <button 
            onClick={() => setIsMenuOpen(true)}
            className="lg:hidden p-2 text-slate-400 hover:text-white transition-colors bg-white/5 rounded-lg"
          >
            <Menu size={20} />
          </button>

          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/overview')}>
            <Shield className="text-blue-500 w-6 h-6 shadow-[0_0_15px_rgba(59,130,246,0.3)]" />
            <h1 className="font-black italic text-lg uppercase tracking-tighter">W-IDS</h1>
          </div>
        </div>
        

        {/* DESKTOP MENU - Sadece geniş ekranda görünür */}
        <div className="hidden lg:flex items-center gap-1">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all font-bold text-[11px] uppercase tracking-wider border ${
                location.pathname === item.path 
                  ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' 
                  : 'text-slate-500 hover:text-white hover:bg-white/5 border-transparent'
              }`}
            >
              {item.name}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-4">
            <Link to="/settings" className="text-slate-500 hover:text-white transition-colors p-2 rounded-xl hover:bg-white/5">
                <Sliders size={18} />
            </Link>
            <Link to="/profile" className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-500 hover:bg-blue-500/20 transition-all shadow-[0_0_15px_rgba(59,130,246,0.1)]">
                <UserIcon size={18} /> {/* UserIcon daha önce import ettiğimiz User ikonu */}
            </Link>
            <button onClick={handleLogout} className="p-2 text-slate-500 hover:text-red-500 transition-colors">
                <LogOut size={18} />
            </button>
            </div>
      </nav>

      {/* SIDE DRAWER (MOBILE) */}
      {/* Karartma Arkaplanı */}
      <div 
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-[110] transition-opacity duration-300 ${isMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setIsMenuOpen(false)}
      />
      
      {/* Yandan Kayan Panel */}
      <aside 
        className={`fixed top-0 left-0 h-full w-72 bg-[#0a0a0a] border-r border-white/5 z-[120] transform transition-transform duration-300 ease-out shadow-2xl ${isMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="p-6 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="text-blue-500 w-5 h-5" />
            <span className="font-black italic uppercase tracking-tighter text-sm">Navigation</span>
          </div>
          <button onClick={() => setIsMenuOpen(false)} className="p-2 text-slate-500 hover:text-white bg-white/5 rounded-full">
            <X size={18} />
          </button>
        </div>

        <nav className="p-4 space-y-2 mt-4 text-center">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsMenuOpen(false)}
                className={`flex items-center justify-between w-full p-4 rounded-2xl font-bold text-xs uppercase tracking-widest transition-all ${
                  isActive ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-white/5'
                }`}
              >
                <div className="flex items-center gap-3">
                  {item.icon}
                  {item.name}
                </div>
                {isActive && <ChevronRight size={14} />}
              </Link>
            );
          })}
        </nav>
      </aside>

      <main className="relative">
        <Outlet />
      </main>
    </div>
  );
}