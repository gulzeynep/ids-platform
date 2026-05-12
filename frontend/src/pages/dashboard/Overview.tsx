import { useQuery } from '@tanstack/react-query';
import { ShieldAlert, Activity, ShieldCheck, ServerCrash, Zap, Globe, Clock, BarChart3, CheckCircle2 } from 'lucide-react';
import { Area, AreaChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { alertsApi, alertKeys } from '../../api/endpoints/alerts';
import { useAlertsStore } from '../../stores/alerts.store';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Skeleton } from '../../components/ui/Skeleton';
import { Button } from '../../components/ui/Button';
import { useNavigate } from 'react-router-dom';
import { getAlertTitle } from '../../utils/alertTitles';

export const Overview = () => {
    const navigate = useNavigate();
    const { realtimeAlerts } = useAlertsStore(); 

    const { data: stats, isLoading, error: statsError } = useQuery({
        queryKey: alertKeys.stats(),
        queryFn: () => alertsApi.getAlertStats(),
        refetchInterval: 3000, 
        refetchIntervalInBackground: true,
    });

    const { data: latestAlerts, error: latestAlertsError } = useQuery({
        queryKey: [...alertKeys.lists(), 'overview-latest'],
        queryFn: () => alertsApi.getAlerts({ status: 'all' }, 0, 8),
        refetchInterval: 5000,
        refetchIntervalInBackground: true,
    });

    const isCompromised = stats && (stats.critical_threats > 0 || stats.active_alerts > 15);
    const statusColor = isCompromised ? "border-red-500/30 bg-red-500/5 text-red-500" : "border-green-500/30 bg-green-500/5 text-green-500";
    const hourlyTrend = stats?.hourly_trend ?? [];
    const hourlyChart = hourlyTrend.map((point) => ({
        time: new Date(point.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        count: point.count,
    }));
    const attackTypes = stats?.attack_type_distribution ?? [];
    const attackMixChart = attackTypes.slice(0, 5).map((item, index) => ({
        name: item.type,
        count: item.count,
        ratio: Math.round(item.ratio * 100),
        fill: ['#3b82f6', '#ef4444', '#22c55e', '#f59e0b', '#a855f7'][index % 5],
    }));
    const resolutionRate = Math.round((stats?.success_metrics?.resolution_rate ?? 0) * 100);

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {(statsError || latestAlertsError) && (
                <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
                    Dashboard telemetry could not be loaded. Check backend auth/session and refresh the page.
                </div>
            )}
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
                            {isCompromised ? "> Alert: Critical anomalies detected in protected traffic." : "> Status: No active critical alerts in backend telemetry."}
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
                            {isLoading ? <Skeleton className="h-10 w-20" /> : stats?.today_alerts ?? 0}
                        </div>
                        <p className="text-[10px] text-neutral-600 mt-2 flex items-center gap-1">
                            <Clock className="w-3 h-3" /> Last 24h. Delta: {stats?.daily_delta ?? 0} vs previous day
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
                        <div className="text-4xl font-bold text-white tabular-nums">
                            {isLoading ? <Skeleton className="h-10 w-16" /> : stats?.secured_segments ?? 0}
                        </div>
                        <p className="text-[10px] text-neutral-600 mt-2 uppercase">Protected origins active</p>
                    </CardContent>
                </Card>
            </div>

            {/*  Canlı Akış Paneli (WebSocket Feed) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <Card className="lg:col-span-2 border-neutral-900 bg-[#0a0a0a]">
                    <CardHeader className="border-b border-neutral-900 pb-4">
                        <CardTitle className="text-sm font-bold flex items-center gap-2">
                            <BarChart3 className="w-4 h-4 text-blue-500" /> Daily Alert Rhythm
                        </CardTitle>
                        <p className="text-xs text-neutral-600">Son 24 saatte alert yoğunluğu. Spike görülen saatler canlı inceleme için önceliklidir.</p>
                    </CardHeader>
                    <CardContent className="pt-6">
                        {isLoading ? (
                            <Skeleton className="h-36 w-full" />
                        ) : hourlyChart.length === 0 ? (
                            <div className="h-36 flex items-center justify-center text-xs text-neutral-600 font-mono border border-dashed border-neutral-900 rounded-lg">
                                No alerts in the last 24 hours.
                            </div>
                        ) : (
                            <div className="h-44">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={hourlyChart} margin={{ top: 8, right: 12, left: -18, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="dailyAlertFill" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.03} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid stroke="rgba(255,255,255,0.07)" strokeDasharray="3 3" vertical={false} />
                                        <XAxis dataKey="time" tick={{ fill: '#737373', fontSize: 10 }} tickLine={false} axisLine={{ stroke: 'rgba(255,255,255,0.08)' }} minTickGap={18} />
                                        <YAxis allowDecimals={false} tick={{ fill: '#737373', fontSize: 10 }} tickLine={false} axisLine={false} />
                                        <Tooltip
                                            content={({ active, payload }) => active && payload?.length ? (
                                                <div className="rounded-lg border border-neutral-800 bg-black px-3 py-2 shadow-xl">
                                                    <p className="text-xs font-bold text-white">{payload[0].payload.time}</p>
                                                    <p className="text-[11px] text-blue-400">{payload[0].value} alerts</p>
                                                </div>
                                            ) : null}
                                        />
                                        <Area type="monotone" dataKey="count" stroke="#60a5fa" strokeWidth={3} fill="url(#dailyAlertFill)" dot={{ r: 2, fill: '#050505', stroke: '#60a5fa' }} />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card className="border-neutral-900 bg-[#0a0a0a]">
                    <CardHeader className="border-b border-neutral-900 pb-4">
                        <CardTitle className="text-sm font-bold flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-green-500" /> Daily Success
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6 space-y-5">
                        <div>
                            <div className="flex items-center justify-between text-xs">
                                <span className="text-neutral-400">Triage completion</span>
                                <span className="font-mono text-green-400">{resolutionRate}%</span>
                            </div>
                            <div className="mt-2 h-2 rounded-full bg-neutral-900 overflow-hidden">
                                <div className="h-full bg-green-500" style={{ width: `${resolutionRate}%` }} />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3 text-xs">
                            <div className="rounded-lg border border-neutral-900 bg-black/30 p-3">
                                <p className="text-neutral-600 uppercase text-[10px]">Blocked</p>
                                <p className="text-lg font-bold text-white">{stats?.success_metrics?.blocked_alerts ?? 0}</p>
                            </div>
                            <div className="rounded-lg border border-neutral-900 bg-black/30 p-3">
                                <p className="text-neutral-600 uppercase text-[10px]">Backlog</p>
                                <p className="text-lg font-bold text-white">{stats?.success_metrics?.active_alerts ?? 0}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

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
                        {(realtimeAlerts.length === 0 && !latestAlerts?.length) ? (
                            <div className="p-12 text-center text-neutral-600 text-sm italic">
                                &gt; Waiting for incoming sensor telemetry...
                            </div>
                        ) : (
                            ([...realtimeAlerts, ...(latestAlerts || [])]
                                .filter((alert, idx, arr) => arr.findIndex((item) => item.id === alert.id) === idx)
                                .slice(0, 8)
                            ).map((alert, idx) => (
                                <div key={idx} className="p-4 border-b border-neutral-900 flex items-center justify-between hover:bg-white/[0.02] transition-colors animate-in slide-in-from-right-4">
                                    <div className="flex items-center gap-4">
                                        <span className={`w-2 h-2 rounded-full ${alert.severity === 'critical' ? 'bg-red-500 animate-pulse' : 'bg-blue-500'}`} />
                                        <div>
                                            <p className="text-xs text-neutral-300 font-bold uppercase">{getAlertTitle(alert)}</p>
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
                        <div className="space-y-3">
                            <p className="text-[10px] text-neutral-500 uppercase tracking-widest">Today Attack Mix</p>
                            {attackTypes.length === 0 ? (
                                <p className="text-xs text-neutral-600 font-mono">No daily attack mix yet.</p>
                            ) : (
                                <div className="grid grid-cols-[110px_1fr] gap-3 items-center">
                                    <div className="h-28">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie data={attackMixChart} dataKey="count" nameKey="name" innerRadius={28} outerRadius={48} paddingAngle={3}>
                                                    {attackMixChart.map((item) => <Cell key={item.name} fill={item.fill} />)}
                                                </Pie>
                                                <Tooltip
                                                    content={({ active, payload }) => active && payload?.length ? (
                                                        <div className="rounded-lg border border-neutral-800 bg-black px-3 py-2 shadow-xl">
                                                            <p className="text-xs font-bold text-white">{payload[0].payload.name}</p>
                                                            <p className="text-[11px] text-blue-400">{payload[0].payload.ratio}% / {payload[0].value} hits</p>
                                                        </div>
                                                    ) : null}
                                                />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                    <div className="space-y-2">
                                        {attackMixChart.slice(0, 4).map((item) => (
                                            <div key={item.name} className="flex items-center justify-between gap-2 text-[10px] text-neutral-400">
                                                <span className="flex min-w-0 items-center gap-1">
                                                    <span className="h-2 w-2 rounded-full flex-shrink-0" style={{ backgroundColor: item.fill }} />
                                                    <span className="truncate">{item.name}</span>
                                                </span>
                                                <span>{item.ratio}%</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="p-3 rounded bg-black/40 border border-neutral-800">
                            <p className="text-[10px] text-neutral-500 uppercase">Last Mitigation</p>
                            <p className="text-xs text-green-500 mt-1">
                                {stats?.last_mitigation
                                    ? `${stats.last_mitigation.ip_address} blocked`
                                    : `${stats?.blocked_ips ?? 0} active gateway deny rules`}
                            </p>
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
