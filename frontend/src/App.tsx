import { useEffect, useState, useMemo, useCallback } from 'react';
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
  
  // SAYFA YENİLEME ÇÖZÜMÜ: view durumunu localStorage'dan oku
  const [view, setView] = useState<'landing' | 'login' | 'register' | 'dashboard' | 'profile' | 'contact' | 'admin'>(
    (localStorage.getItem('currentView') as any) || (localStorage.getItem('token') ? 'dashboard' : 'landing')
  );

  // View değiştikçe localStorage'a kaydet
  useEffect(() => {
    localStorage.setItem('currentView', view);
  }, [view]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('currentView');
    setIsAuthenticated(false);
    setUser(null);
    setView('landing');
  };

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
    setView('dashboard');
  };

  // fetchAlerts fonksiyonunu useCallback içine aldık ki bağımlılık hatası vermesin
  const fetchAlerts = useCallback(async () => {
    if (!isAuthenticated || view !== 'dashboard') return;
    try {
      setLoading(true);
      const response = await api.get('/alerts/list');
      setAlerts(response.data);
      setLastUpdated(new Date());
    } catch (error) {
      console.error("Dashboard Sync Error:", error);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, view]);

  useEffect(() => {
    if (isAuthenticated) {
      api.get('/auth/me').then(res => setUser(res.data)).catch(() => handleLogout());
      fetchAlerts();
      const interval = setInterval(fetchAlerts, 5000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, fetchAlerts]);

  const chartData = useMemo(() => {
    const counts: Record<string, number> = {};
    alerts.forEach(a => { counts[a.type] = (counts[a.type] || 0) + 1; });
    return Object.keys(counts).map(k => ({ name: k, value: counts[k] }));
  }, [alerts]);

  const criticalCount = alerts.filter(a => a.severity.toLowerCase() === 'critical').length;

  useEffect(() => {
    const handleSetView = (e: any) => setView(e.detail);
    window.addEventListener('setView', handleSetView);
    return () => window.removeEventListener('setView', handleSetView);
  }, []);

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
          <button onClick={fetchAlerts} className="p-2 text-slate-500 hover:text-white transition-colors">
            <RefreshCcw size={16} className={loading ? "animate-spin text-blue-500" : ""} />
          </button>
          <div className="hidden md:block text-[10px] text-slate-500 font-mono italic pr-4 border-r border-white/10">SYNC: {lastUpdated.toLocaleTimeString()}</div>
          {user?.is_admin && <button onClick={() => setView('admin')} className="p-2 text-red-500 hover:bg-red-500/10 rounded-xl border border-red-500/20"><ShieldAlert size={18}/></button>}
          <button onClick={() => setView('profile')} className="p-2 text-slate-400 hover:text-white"><UserIcon size={20}/></button>
        </div>
      </nav>

      <main className="max-w-[1600px] mx-auto p-6 grid grid-cols-12 gap-6 animate-in fade-in duration-500">
        <div className="col-span-12 lg:col-span-4 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-6 bg-[#0a0a0a] border border-white/5 rounded-[32px]">
              <div className="flex items-center justify-between mb-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                <span>Total Alerts</span>
                <Database size={14} className="text-blue-500" />
              </div>
              <p className="text-3xl font-black">{alerts.length}</p>
            </div>
            <div className={`p-6 border rounded-[32px] transition-all ${criticalCount > 0 ? "bg-red-500/5 border-red-500/20" : "bg-[#0a0a0a] border-white/5"}`}>
              <div className="flex items-center justify-between mb-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                <span>Critical</span>
                <AlertTriangle size={14} className={criticalCount > 0 ? "text-red-500" : "text-slate-500"} />
              </div>
              <p className={`text-3xl font-black ${criticalCount > 0 ? "text-red-500" : "text-white"}`}>{criticalCount}</p>
            </div>
          </div>

          <div className="p-6 bg-[#0a0a0a] border border-white/5 rounded-[32px]">
            <div className="flex items-center gap-2 mb-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">
              <Activity size={14} className="text-blue-500" /> Analysis Chart
            </div>
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={chartData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value" stroke="none">
                    {chartData.map((_, index) => (<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#000', border: '1px solid #222', borderRadius: '12px' }} />
                  <Legend iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          <div className="p-6 bg-[#0a0a0a] border border-white/5 rounded-[32px]">
            <div className="flex items-center gap-2 mb-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">
              <Globe size={14} className="text-blue-500 animate-pulse"/> Global Status
            </div>
            <p className="text-sm text-slate-400 italic">Monitoring all entry points for {user?.company_name || 'Organization'}</p>
          </div>
        </div>

        <div className="col-span-12 lg:col-span-8 bg-[#0a0a0a] border border-white/5 rounded-[32px] overflow-hidden flex flex-col">
          <div className="p-6 border-b border-white/5 flex items-center gap-2">
            <Terminal size={14} className="text-slate-400"/>
            <h2 className="font-bold text-xs uppercase tracking-[0.3em] text-slate-400">Live Intrusion Feed</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-white/5 text-[10px] uppercase font-black text-slate-500">
                <tr>
                  <th className="px-6 py-4 italic">Time</th>
                  <th className="px-6 py-4 italic">Vector</th>
                  <th className="px-6 py-4 italic">Origin</th>
                  <th className="px-6 py-4 text-right italic">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {alerts.map((alert) => (
                  <tr key={alert.id} className="group hover:bg-blue-500/[0.02] transition-colors">
                    <td className="px-6 py-4 text-[10px] font-mono text-slate-500 italic">
                      {new Date(alert.timestamp).toLocaleTimeString()}
                    </td>
                    <td className="px-6 py-4 font-bold text-white group-hover:text-blue-400">
                      {alert.type}
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-slate-400">
                      {alert.source_ip}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className={`px-2 py-1 rounded-md text-[9px] font-black uppercase border ${
                        alert.severity.toLowerCase() === 'critical' ? 'bg-red-500/10 text-red-500 border-red-500/20 shadow-lg shadow-red-500/10' : 
                        'bg-blue-500/10 text-blue-500 border-blue-500/20'
                      }`}>
                        {alert.severity}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {alerts.length === 0 && !loading && (
              <div className="p-20 text-center text-slate-600 italic text-xs uppercase tracking-widest">
                Perimeter Secure. No threats detected.
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;