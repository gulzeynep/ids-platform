import { useQuery } from '@tanstack/react-query';
import { ShieldAlert, Activity, ShieldCheck, ServerCrash, Zap, Globe, Clock } from 'lucide-react';
import { alertsApi, alertKeys } from '../../api/endpoints/alerts';
import { useAlertsStore } from '../../stores/alerts.store';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Skeleton } from '../../components/ui/Skeleton';
import { Button } from '../../components/ui/Button';
import { useNavigate } from 'react-router-dom';

export const Overview = () => {
    const navigate = useNavigate();
    const { realtimeAlerts } = useAlertsStore(); 

    const { data: stats, isLoading, isError } = useQuery({
        queryKey: alertKeys.stats(),
        queryFn: () => alertsApi.getAlertStats(),
        refetchInterval: 3000, 
    });

    const isCompromised = stats && (stats.critical_threats > 0 || stats.active_alerts > 15);
    const statusColor = isCompromised ? "border-red-500/30 bg-red-500/5 text-red-500" : "border-green-500/30 bg-green-500/5 text-green-500";

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/*  Canlı Sistem Durum Barı */}
            <div className={`p-6 rounded-2xl border flex items-center justify-between transition-all duration-1000 ${statusColor}`}>
                <div className="flex items-center gap-6">
                    <div className="relative">
                        {isCompromised ? <ServerCrash className="w-12 h-12 animate-bounce" /> : <ShieldCheck className="w-12 h-12" />}
                        {!isLoading && <span className={`absolute -top-1 -right-1 w-4 h-4 rounded-full border-4 border-[#050505] animate-ping ${isCompromised ? 'bg-red-500' : 'bg-green-500'}`} />}
                    </div>
                    <div>
                        <h3 className="font-bold text-2xl uppercase tracking-tighter">
                            {isLoading ? "Synchronizing..." : isCompromised ? "Incident in Progress" : "System Nominal"}
                        </h3>
                        <p className="text-sm opacity-80 font-mono">
                            {isCompromised ? "> Alert: Critical anomalies detected in edge sensors." : "> Status: All clusters operating within baseline parameters."}
                        </p>
                    </div>
                </div>
            </div>

            {/*  Operasyonel Kartlar */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="bg-[#0a0a0a] border-neutral-900">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-xs font-semibold text-neutral-500 uppercase tracking-widest">Live Traffic</CardTitle>
                        <Activity className="w-4 h-4 text-blue-500 animate-pulse" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-4xl font-bold text-white tabular-nums">
                            {isLoading ? <Skeleton className="h-10 w-20" /> : stats?.active_alerts}
                        </div>
                        <p className="text-[10px] text-neutral-600 mt-2 flex items-center gap-1">
                            <Clock className="w-3 h-3" /> Requests per second: 124.2
                        </p>
                    </CardContent>
                </Card>

                <Card className={`bg-[#0a0a0a] border-neutral-900 ${stats?.critical_threats ? 'ring-1 ring-red-500/20' : ''}`}>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-xs font-semibold text-neutral-500 uppercase tracking-widest">Active Threats</CardTitle>
                        <ShieldAlert className={`w-4 h-4 ${stats?.critical_threats ? 'text-red-500 animate-ping' : 'text-neutral-700'}`} />
                    </CardHeader>
                    <CardContent>
                        <div className={`text-4xl font-bold tabular-nums ${stats?.critical_threats ? 'text-red-500' : 'text-white'}`}>
                            {isLoading ? <Skeleton className="h-10 w-16" /> : stats?.critical_threats}
                        </div>
                        <p className="text-[10px] text-neutral-600 mt-2 uppercase tracking-tight">Requires immediate response</p>
                    </CardContent>
                </Card>

                <Card className="bg-[#0a0a0a] border-neutral-900">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-xs font-semibold text-neutral-500 uppercase tracking-widest">Secured Segments</CardTitle>
                        <Zap className="w-4 h-4 text-yellow-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-4xl font-bold text-white tabular-nums">100%</div>
                        <p className="text-[10px] text-neutral-600 mt-2 uppercase">L7 Protection Active</p>
                    </CardContent>
                </Card>
            </div>

            {/*  Canlı Akış Paneli (WebSocket Feed) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <Card className="lg:col-span-2 border-neutral-900 bg-[#0a0a0a]">
                    <CardHeader className="border-b border-neutral-900 pb-4">
                        <div className="flex justify-between items-center">
                            <CardTitle className="text-sm font-bold flex items-center gap-2">
                                <Globe className="w-4 h-4 text-blue-500" /> Neural Stream (Live)
                            </CardTitle>
                            <Button variant="ghost" size="sm" className="text-[10px]" onClick={() => navigate('/intrusions')}>
                                View All
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0 max-h-[350px] overflow-y-auto font-mono scrollbar-hide">
                        {realtimeAlerts.length === 0 ? (
                            <div className="p-12 text-center text-neutral-600 text-sm italic">
                                &gt; Waiting for incoming sensor telemetry...
                            </div>
                        ) : (
                            realtimeAlerts.map((alert, idx) => (
                                <div key={idx} className="p-4 border-b border-neutral-900 flex items-center justify-between hover:bg-white/[0.02] transition-colors animate-in slide-in-from-right-4">
                                    <div className="flex items-center gap-4">
                                        <span className={`w-2 h-2 rounded-full ${alert.severity === 'critical' ? 'bg-red-500 animate-pulse' : 'bg-blue-500'}`} />
                                        <div>
                                            <p className="text-xs text-neutral-300 font-bold uppercase">{alert.type}</p>
                                            <p className="text-[10px] text-neutral-600 italic">SRC: {alert.source_ip}</p>
                                        </div>
                                    </div>
                                    <span className="text-[10px] text-neutral-700">{new Date(alert.timestamp).toLocaleTimeString()}</span>
                                </div>
                            ))
                        )}
                    </CardContent>
                </Card>

                {/* Yan Panel*/}
                <Card className="border-neutral-900 bg-blue-500/[0.02]">
                    <CardHeader>
                        <CardTitle className="text-sm">Response Readiness</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="p-3 rounded bg-black/40 border border-neutral-800">
                            <p className="text-[10px] text-neutral-500 uppercase">Last Mitigation</p>
                            <p className="text-xs text-green-500 mt-1">IP 185.22.XX.XX blocked successfully</p>
                        </div>
                        <Button variant="primary" className="w-full text-xs h-11" onClick={() => navigate('/defense')}>
                            Deploy Firewall Rules
                        </Button>
                        <Button variant="secondary" className="w-full text-xs h-11" onClick={() => navigate('/intrusions')}>
                            Start Manual Triage
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};