import { useQuery } from '@tanstack/react-query';
import { ShieldAlert, Activity, ShieldCheck, ServerCrash, Zap } from 'lucide-react';
import { alertsApi, alertKeys } from '../../api/endpoints/alerts';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Skeleton } from '../../components/ui/Skeleton';

export const Overview = () => {
    // React Query ile istatistikleri çekiyoruz
    // Backend'deki /alerts/stats endpoint'ini kullanır
    const { data: stats, isLoading, isError } = useQuery({
        queryKey: [...alertKeys.all, 'stats'],
        queryFn: () => alertsApi.getAlertStats(),
        refetchInterval: 5000, // Her 5 saniyede bir verileri tazeler
    });

    if (isError) {
      return (
        <div className="p-6 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500">
          Failed to establish connection with SOC core. Please check your sensor status.
        </div>
      );
    }

    const isCompromised = stats && (stats.critical_threats > 0 || stats.active_alerts > 10);
    const statusColor = isCompromised ? "text-red-500 border-red-500/30 bg-red-500/5" : "text-green-500 border-green-500/30 bg-green-500/5";

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Sayfa Başlığı */}
            <div>
                <h2 className="text-3xl font-bold text-white tracking-tight">Command Center</h2>
                <p className="text-neutral-500 mt-1">Real-time system telemetry and global threat overview</p>
            </div>

            {/* Sistem Durum Paneli */}
            <div className={`p-6 rounded-2xl border flex items-center gap-6 transition-colors duration-500 ${statusColor}`}>
                {isLoading ? (
                  <Skeleton className="w-12 h-12 rounded-full" />
                ) : isCompromised ? (
                  <ServerCrash className="w-12 h-12 animate-pulse" />
                ) : (
                  <ShieldCheck className="w-12 h-12" />
                )}
                
                <div className="flex-1">
                    <h3 className="font-bold text-xl uppercase tracking-widest flex items-center gap-2">
                        System Status: {isLoading ? "Scanning..." : isCompromised ? "Compromised" : "Secure"}
                    </h3>
                    <p className="text-sm opacity-70 mt-1">
                        {isCompromised 
                            ? "Anomalies detected in Layer 7 traffic. Immediate triage required for critical segments." 
                            : "All neural sensors operational. Baseline traffic remains within safe parameters."}
                    </p>
                </div>
                {!isLoading && (
                  <div className="hidden md:block">
                    <Zap className={`w-8 h-8 ${isCompromised ? 'text-red-400' : 'text-green-400'}`} />
                  </div>
                )}
            </div>

            {/* İstatistik Kartları */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Aktif Tehditler */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-neutral-400">Active Threats</CardTitle>
                        <Activity className="w-4 h-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                          <Skeleton className="h-9 w-24 mt-1" />
                        ) : (
                          <div className="text-4xl font-bold text-white tabular-nums">{stats?.active_alerts}</div>
                        )}
                        <p className="text-xs text-neutral-500 mt-2">+12% from last hour</p>
                    </CardContent>
                </Card>

                {/* Kritik Saldırılar */}
                <Card className={stats?.critical_threats && stats.critical_threats > 0 ? "border-red-900/50" : ""}>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-neutral-400">Critical Intrusions</CardTitle>
                        <ShieldAlert className="w-4 h-4 text-red-500" />
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                          <Skeleton className="h-9 w-24 mt-1" />
                        ) : (
                          <div className={`text-4xl font-bold tabular-nums ${stats?.critical_threats && stats.critical_threats > 0 ? 'text-red-500' : 'text-white'}`}>
                            {stats?.critical_threats}
                          </div>
                        )}
                        <p className="text-xs text-neutral-500 mt-2">Requires immediate attention</p>
                    </CardContent>
                </Card>

                {/* Çözülen Olaylar */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-neutral-400">Resolved Events</CardTitle>
                        <ShieldCheck className="w-4 h-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                          <Skeleton className="h-9 w-24 mt-1" />
                        ) : (
                          <div className="text-4xl font-bold text-green-500 tabular-nums">{stats?.resolved_alerts}</div>
                        )}
                        <p className="text-xs text-neutral-500 mt-2">Triage efficiency: 94%</p>
                    </CardContent>
                </Card>

            </div>

            {/* Buraya ilerleyen aşamalarda Tehdit Haritası veya Son Saldırılar Listesi gelecek */}
        </div>
    );
};
export default Overview;