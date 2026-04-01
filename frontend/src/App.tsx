import { useEffect, useState } from 'react';
import { Shield, AlertTriangle, Activity, Database } from 'lucide-react';
import api from './lib/api';

function App() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAlerts = async () => {
    try {
      const response = await api.get('/alerts/list'); 
      setAlerts(response.data);
    } catch (error) {
      console.error("Veri çekme hatası:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
    // Her 10 saniyede bir veriyi tazele (Polling)
    const interval = setInterval(fetchAlerts, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-200 p-6">
      {/* Üst Bar */}
      <header className="flex justify-between items-center mb-8 border-b border-neutral-800 pb-4">
        <div className="flex items-center gap-2">
          <Shield className="text-blue-500 w-8 h-8" />
          <h1 className="text-2xl font-bold tracking-tight">W-IDS <span className="text-neutral-500 font-light">| Monitor</span></h1>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <span className="flex items-center gap-1"><Activity className="text-green-500 w-4 h-4" /> Sistem Aktif</span>
          <span className="bg-neutral-800 px-3 py-1 rounded-full border border-neutral-700">Admin_User</span>
        </div>
      </header>

      {/* İstatistik Kartları */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <StatCard title="Toplam Alarm" value={alerts.length} icon={<Database className="text-blue-400" />} />
        <StatCard title="Kritik Tehdit" value="0" icon={<AlertTriangle className="text-red-500" />} color="border-red-900/50" />
        <StatCard title="Aktif Sensörler" value="3" icon={<Shield className="text-green-400" />} />
        <StatCard title="Sistem Yükü" value="%12" icon={<Activity className="text-orange-400" />} />
      </div>

      {/* Alarm Listesi / Tablo */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-neutral-800 flex justify-between items-center">
          <h2 className="font-semibold text-lg">Son Algılanan Alarmlar</h2>
          <button onClick={fetchAlerts} className="text-xs bg-neutral-800 hover:bg-neutral-700 px-3 py-1 rounded transition">Yenile</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-neutral-800/50 text-neutral-400 uppercase text-xs">
              <tr>
                <th className="p-4">Zaman</th>
                <th className="p-4">Saldırı Tipi</th>
                <th className="p-4">Kaynak IP</th>
                <th className="p-4">Şiddet</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800">
              {alerts.length > 0 ? alerts.map((alert: any) => (
                <tr key={alert.id} className="hover:bg-neutral-800/30 transition">
                  <td className="p-4 text-neutral-500">{new Date(alert.created_at).toLocaleTimeString()}</td>
                  <td className="p-4 font-medium text-blue-400">{alert.type}</td>
                  <td className="p-4 font-mono">{alert.source_ip}</td>
                  <td className="p-4">
                    <span className="px-2 py-1 rounded-md bg-red-900/20 text-red-400 border border-red-900/30 text-xs">Yüksek</span>
                  </td>
                </tr>
              )) : (
                <tr><td colSpan={4} className="p-10 text-center text-neutral-600">Henüz alarm bulunamadı...</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// Küçük Stat Kartı Bileşeni
function StatCard({ title, value, icon, color = "border-neutral-800" }: any) {
  return (
    <div className={`bg-neutral-900 border ${color} p-5 rounded-xl`}>
      <div className="flex justify-between items-start mb-2">
        <span className="text-neutral-500 text-sm font-medium">{title}</span>
        {icon}
      </div>
      <div className="text-3xl font-bold">{value}</div>
    </div>
  );
}

export default App;