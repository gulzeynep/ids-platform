import { useEffect, useState, useMemo } from 'react';
import Login from './components/Login';
import LandingPage from './components/LandingPage';
import Profile from './components/Profile';
import Register from './components/Register';
import Contact from './components/Contact';
import AdminPanel from './components/AdminPanel';
import { Shield, AlertTriangle, Activity, Database, Terminal, RefreshCcw, Globe, User as UserIcon, ShieldAlert } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import api from './lib/api';

interface Alert { id: number; type: string; severity: string; source_ip: string; timestamp: string; }
interface User { username: string; is_admin: boolean; company_name?: string; }
const COLORS = ['#3b82f6', '#ef4444', '#f59e0b', '#10b981', '#8b5cf6'];

function App() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('token'));
  const [view, setView] = useState<'landing' | 'login' | 'register' | 'dashboard' | 'profile' | 'contact' | 'admin'>(
    localStorage.getItem('token') ? 'dashboard' : 'landing'
  );

  // Global View Listener (Login/Register içinden Contact'a gitmek için)
  useEffect(() => {
    const handleSetView = (e: any) => setView(e.detail);
    window.addEventListener('setView', (e) => handleSetView(e));
    return () => window.removeEventListener('setView', handleSetView);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsAuthenticated(false);
    setUser(null);
    setView('landing');
  };

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
    setView('dashboard');
  };

  useEffect(() => {
    if (isAuthenticated) {
      api.get('/auth/me').then(res => setUser(res.data)).catch(() => handleLogout());
      const fetchAlerts = async () => {
        if (view !== 'dashboard') return;
        try { setLoading(true); const res = await api.get('/alerts/list'); setAlerts(res.data); setLastUpdated(new Date()); } 
        catch (e) { console.error(e); } finally { setLoading(false); }
      };
      fetchAlerts();
      const interval = setInterval(fetchAlerts, 5000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, view]);

  const chartData = useMemo(() => {
    const counts: Record<string, number> = {};
    alerts.forEach(a => { counts[a.type] = (counts[a.type] || 0) + 1; });
    return Object.keys(counts).map(k => ({ name: k, value: counts[k] }));
  }, [alerts]);

  // ROUTING
  if (!isAuthenticated) {
    if (view === 'login') return <Login onLoginSuccess={handleLoginSuccess} onRegisterClick={() => setView('register')} onBack={() => setView('landing')} />;
    if (view === 'register') return <Register onRegisterSuccess={() => setView('login')} onBack={() => setView('landing')} />;
    if (view === 'contact') return <Contact onBack={() => setView('landing')} />;
    return <LandingPage onGetStarted={() => setView('register')} onLoginClick={() => setView('login')} onContactClick={() => setView('contact')} />;
  }

  if (view === 'profile') return <Profile user={user} onBack={() => setView('dashboard')} onLogout={handleLogout} />;
  if (view === 'admin' && user?.is_admin) return <AdminPanel onBack={() => setView('dashboard')} />;

  return (
    <div className="min-h-screen bg-[#050505] text-slate-200 font-sans selection:bg-blue-500/30">
      <nav className="border-b border-white/5 bg-black/50 backdrop-blur-md sticky top-0 z-50 h-16 flex items-center px-6 justify-between">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => setView('dashboard')}>
          <Shield className="text-blue-500 w-6 h-6" />
          <h1 className="font-black italic text-lg uppercase tracking-tighter">W-IDS CORE</h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden md:block text-[10px] text-slate-500 font-mono italic pr-4 border-r border-white/10">SYNC: {lastUpdated.toLocaleTimeString()}</div>
          {user?.is_admin && <button onClick={() => setView('admin')} className="p-2 text-red-500 hover:bg-red-500/10 rounded-xl border border-red-500/20"><ShieldAlert size={18}/></button>}
          <button onClick={() => setView('profile')} className="p-2 text-slate-400 hover:text-white"><UserIcon size={20}/></button>
        </div>
      </nav>
      <main className="max-w-[1600px] mx-auto p-6 grid grid-cols-12 gap-6">
        {/* Dashboard içeriğin buraya geliyor (Tablolar, Grafikler) */}
        <div className="col-span-12 lg:col-span-4 space-y-6">
           <div className="p-6 bg-[#0a0a0a] border border-white/5 rounded-[32px]">
              <div className="flex items-center gap-2 mb-4 text-[10px] font-black text-slate-500 uppercase tracking-widest"><Globe size={14} className="text-blue-500 animate-pulse"/> Global Link</div>
              <p className="text-2xl font-black">{alerts.length} ALERTS</p>
           </div>
        </div>
        <div className="col-span-12 lg:col-span-8 bg-[#0a0a0a] border border-white/5 rounded-[32px] p-6 min-h-[400px]">
           <h2 className="font-bold text-xs uppercase tracking-[0.3em] mb-6 flex items-center gap-2 text-slate-400"><Terminal size={14}/> Live Feed</h2>
           {/* Tablo kodların buraya */}
        </div>
      </main>
    </div>
  );
}

export default App;