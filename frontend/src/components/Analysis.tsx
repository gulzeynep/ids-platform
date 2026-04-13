import { useQuery } from '@tanstack/react-query';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { Activity, Globe, Database, ShieldAlert, Loader2 } from 'lucide-react';
import api from '../lib/api';

// Professional dashboard colors
const COLORS = ['#3b82f6', '#ef4444', '#f59e0b', '#10b981', '#6366f1'];

const Analysis = () => {
  // Fetch detailed analytics (Top IPs, Severities, Protocols)
  const { data, isLoading, error } = useQuery({
    queryKey: ['security-analysis'],
    queryFn: async () => {
      const response = await api.get('/alerts/stats/analysis');
      return response.data;
    },
    refetchInterval: 30000, // Update every 30 seconds
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-4">
        <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
        <p className="text-slate-400 animate-pulse">Synchronizing threat intelligence...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-6 rounded-2xl">
        <h3 className="font-bold flex items-center gap-2 mb-2">
          <ShieldAlert className="w-5 h-5" /> Analytics Connection Failed
        </h3>
        <p className="text-sm">Unable to reach the security engine. Please verify the backend status.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* HEADER SECTION */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Threat Analysis</h1>
          <p className="text-slate-400 text-sm">Deep dive into workspace security metrics and attacker behavior</p>
        </div>
        <div className="flex items-center gap-2 bg-blue-500/10 text-blue-400 px-4 py-2 rounded-lg border border-blue-500/20">
          <Activity className="w-4 h-4 animate-pulse" />
          <span className="text-xs font-bold uppercase">Real-time Engine Active</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* TOP ATTACKER IPs (Bar Chart) */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl">
          <div className="flex items-center gap-3 mb-6">
            <Globe className="text-blue-500 w-5 h-5" />
            <h3 className="text-white font-semibold">Top Threat Sources (By IP)</h3>
          </div>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.top_ips}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="ip" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* SEVERITY DISTRIBUTION (Pie Chart) */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl">
          <div className="flex items-center gap-3 mb-6">
            <ShieldAlert className="text-red-500 w-5 h-5" />
            <h3 className="text-white font-semibold">Severity Distribution</h3>
          </div>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data?.severities}
                  dataKey="count"
                  nameKey="severity"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  innerRadius={60}
                  paddingAngle={5}
                >
                  {data?.severities.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px' }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '20px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* PROTOCOL BREAKDOWN (Table / Stats) */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl lg:col-span-2">
          <div className="flex items-center gap-3 mb-6">
            <Database className="text-emerald-500 w-5 h-5" />
            <h3 className="text-white font-semibold">Protocol Analysis</h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {data?.protocols.map((proto: any) => (
              <div key={proto.protocol} className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-center">
                <div className="text-emerald-500 text-2xl font-bold">{proto.count}</div>
                <div className="text-slate-500 text-xs font-medium uppercase tracking-widest">{proto.protocol}</div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

export default Analysis;