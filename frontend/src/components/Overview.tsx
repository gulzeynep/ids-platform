import { useQuery } from '@tanstack/react-query';
import { Shield, AlertTriangle, CheckCircle, Activity, Loader2 } from 'lucide-react';
import api from '../lib/api';

const Overview = () => {
  // TanStack Query handles caching, loading, and error states automatically
  const { data, isLoading, error } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const response = await api.get('/alerts/stats/overview');
      return response.data;
    },
    refetchInterval: 10000, // Refresh data every 10 seconds for real-time feel
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-4 rounded-xl">
        Failed to fetch security metrics. Please check your connection.
      </div>
    );
  }

  const stats = [
    { label: 'Active Alerts', value: data?.active_alerts, icon: Shield, color: 'text-blue-500' },
    { label: 'Critical Threats', value: data?.critical_threats, icon: AlertTriangle, color: 'text-red-500' },
    { label: 'Resolved', value: data?.resolved_alerts, icon: CheckCircle, color: 'text-emerald-500' },
    { label: 'Live Sensors', value: data?.active_sensors, icon: Activity, color: 'text-amber-500' },
  ];

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <stat.icon className={`${stat.color} w-6 h-6`} />
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Live Status</span>
            </div>
            <h3 className="text-3xl font-bold text-white mb-1">{stat.value}</h3>
            <p className="text-slate-400 text-sm">{stat.label}</p>
          </div>
        ))}
      </div>
      
      {/* Additional dashboard components like Charts or Recent Alerts go here */}
    </div>
  );
};

export default Overview;