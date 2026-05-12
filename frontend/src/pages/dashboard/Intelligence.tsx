import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Globe, TrendingUp, Skull, BarChart3, Fingerprint, Target, ShieldCheck } from 'lucide-react';
import {
    Area,
    AreaChart,
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';
import { alertsApi } from '../../api/endpoints/alerts';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Skeleton } from '../../components/ui/Skeleton';
import { Button } from '../../components/ui/Button';
import type { IntelligenceStats, TrendPoint } from '../../types';

type Period = 'week' | 'month';

const formatPercent = (value: number | undefined) => `${Math.round((value ?? 0) * 100)}%`;
const CHART_COLORS = ['#3b82f6', '#ef4444', '#22c55e', '#f59e0b', '#a855f7', '#14b8a6', '#f97316', '#e11d48'];

interface NormalizedTrendPoint {
    label: string;
    shortLabel: string;
    count: number;
}

const dateKey = (date: Date) => date.toISOString().slice(0, 10);

const normalizeTrend = (trend: TrendPoint[], periodDays: number): NormalizedTrendPoint[] => {
    const countsByDay = new Map(
        trend.map((point) => [dateKey(new Date(point.timestamp)), point.count])
    );
    const today = new Date();

    return Array.from({ length: periodDays }, (_, index) => {
        const date = new Date(today);
        date.setHours(0, 0, 0, 0);
        date.setDate(today.getDate() - (periodDays - index - 1));
        const key = dateKey(date);

        return {
            label: date.toLocaleDateString([], { month: 'short', day: 'numeric' }),
            shortLabel: periodDays > 10 && index % 5 !== 0 ? '' : date.toLocaleDateString([], { month: 'numeric', day: 'numeric' }),
            count: countsByDay.get(key) ?? 0,
        };
    });
};

const TrendAreaChart = ({ points }: { points: NormalizedTrendPoint[] }) => {
    const lastPoint = points[points.length - 1];
    const peak = points.reduce((winner, point) => point.count > winner.count ? point : winner, points[0] ?? { label: '', shortLabel: '', count: 0 });

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="rounded-lg border border-neutral-900 bg-black/30 p-3">
                    <p className="text-[10px] uppercase text-neutral-500">Latest Day</p>
                    <p className="text-xl font-bold text-white">{lastPoint?.count ?? 0}</p>
                </div>
                <div className="rounded-lg border border-neutral-900 bg-black/30 p-3">
                    <p className="text-[10px] uppercase text-neutral-500">Peak Day</p>
                    <p className="text-xl font-bold text-white">{peak.count}</p>
                </div>
                <div className="rounded-lg border border-neutral-900 bg-black/30 p-3">
                    <p className="text-[10px] uppercase text-neutral-500">Daily Avg</p>
                    <p className="text-xl font-bold text-white">
                        {Math.round(points.reduce((sum, point) => sum + point.count, 0) / Math.max(points.length, 1))}
                    </p>
                </div>
                <div className="rounded-lg border border-neutral-900 bg-black/30 p-3">
                    <p className="text-[10px] uppercase text-neutral-500">Peak Date</p>
                    <p className="text-sm font-bold text-white mt-1">{peak.label || 'n/a'}</p>
                </div>
            </div>
            <div className="h-72 rounded-lg border border-neutral-900 bg-black/30 p-4">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={points} margin={{ top: 8, right: 10, left: -12, bottom: 0 }}>
                        <defs>
                            <linearGradient id="alertTrendFill" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.45} />
                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.03} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid stroke="rgba(255,255,255,0.07)" strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="shortLabel" tick={{ fill: '#737373', fontSize: 11 }} tickLine={false} axisLine={{ stroke: 'rgba(255,255,255,0.08)' }} interval={0} />
                        <YAxis allowDecimals={false} tick={{ fill: '#737373', fontSize: 11 }} tickLine={false} axisLine={false} />
                        <Tooltip
                            content={({ active, payload }) => active && payload?.length ? (
                                <div className="rounded-lg border border-neutral-800 bg-black px-3 py-2 shadow-xl">
                                    <p className="text-xs font-bold text-white">{payload[0].payload.label}</p>
                                    <p className="text-[11px] text-blue-400">{payload[0].value} alerts</p>
                                </div>
                            ) : null}
                        />
                        <Area type="monotone" dataKey="count" stroke="#60a5fa" strokeWidth={3} fill="url(#alertTrendFill)" dot={{ r: 3, strokeWidth: 2, fill: '#050505' }} activeDot={{ r: 5 }} />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

const Description = ({ children }: { children: string }) => (
    <p className="mt-2 text-[11px] leading-relaxed text-neutral-600">{children}</p>
);

export const Intelligence = () => {
    const [period, setPeriod] = useState<Period>('week');

    const { data: stats, isLoading } = useQuery({
        queryKey: ['intelligence_stats', period],
        queryFn: () => alertsApi.getAnalysisStats(period) as Promise<IntelligenceStats>,
        refetchInterval: 30000,
    });

    const periodLabel = period === 'week' ? '7 days' : '30 days';
    const dailyTrend = stats?.daily_trend ?? [];
    const normalizedTrend = normalizeTrend(dailyTrend, stats?.period_days ?? (period === 'week' ? 7 : 30));
    const attackTypes = stats?.attack_type_distribution ?? [];
    const severityEntries = Object.entries(stats?.severity_distribution ?? {});
    const protocolEntries = Object.entries(stats?.protocol_distribution ?? {});
    const attackTypeChart = attackTypes.map((item, index) => ({
        name: item.type,
        count: item.count,
        ratio: Math.round(item.ratio * 100),
        fill: CHART_COLORS[index % CHART_COLORS.length],
    }));
    const protocolChart = protocolEntries.map(([protocol, count], index) => ({
        name: protocol.toUpperCase(),
        count,
        fill: CHART_COLORS[index % CHART_COLORS.length],
    }));
    const severityChart = severityEntries.map(([severity, count], index) => ({
        name: severity.toUpperCase(),
        count,
        fill: CHART_COLORS[index % CHART_COLORS.length],
    }));

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                <div>
                    <h2 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
                        <Fingerprint className="text-blue-500 w-8 h-8" /> Threat Intelligence
                    </h2>
                    <p className="text-neutral-500 mt-1 font-mono text-sm">
                        &gt; weekly and monthly pattern analysis from workspace telemetry
                    </p>
                </div>
                <div className="flex rounded-lg border border-neutral-800 bg-black/40 p-1">
                    {(['week', 'month'] as Period[]).map((item) => (
                        <Button
                            key={item}
                            variant={period === item ? 'primary' : 'ghost'}
                            size="sm"
                            className="h-8 min-w-20 text-xs"
                            onClick={() => setPeriod(item)}
                        >
                            {item === 'week' ? 'Weekly' : 'Monthly'}
                        </Button>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="bg-blue-500/5 border-blue-500/20">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <p className="text-xs font-semibold text-blue-400 uppercase">Period Volume</p>
                            <TrendingUp className="w-4 h-4 text-blue-500" />
                        </div>
                        <p className="text-2xl font-bold text-white mt-2">{isLoading ? '...' : stats?.trend_period.current ?? 0}</p>
                        <p className="text-[10px] text-neutral-500 mt-1">{periodLabel}, delta {stats?.trend_period.delta ?? 0}</p>
                        <Description>Selected period içindeki toplam alert hacmini ve önceki aynı dönemle farkı gösterir.</Description>
                    </CardContent>
                </Card>
                <Card className="bg-red-500/5 border-red-900/20">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <p className="text-xs font-semibold text-red-400 uppercase">Unique Attackers</p>
                            <Skull className="w-4 h-4 text-red-500" />
                        </div>
                        <p className="text-2xl font-bold text-white mt-2">{isLoading ? '...' : stats?.unique_attackers ?? 0}</p>
                        <Description>Kaç farklı source IP’den saldırı gözlendiğini gösterir; yüksek değer geniş tarama davranışına işaret eder.</Description>
                    </CardContent>
                </Card>
                <Card className="bg-neutral-900/40 border-neutral-800">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <p className="text-xs font-semibold text-neutral-400 uppercase">Top Rule</p>
                            <Fingerprint className="w-4 h-4 text-neutral-500" />
                        </div>
                        <p className="text-sm font-bold text-white mt-2 truncate">{stats?.top_rule?.signature_msg || 'No signatures yet'}</p>
                        <p className="text-[10px] text-neutral-500 mt-1">SID {stats?.top_rule?.sid ?? 'n/a'} / {stats?.top_rule?.count ?? 0} hits</p>
                        <Description>En çok tetiklenen signature kuralını öne çıkarır; tuning ve false positive incelemesi için başlangıç noktasıdır.</Description>
                    </CardContent>
                </Card>
                <Card className="bg-green-500/5 border-green-900/20">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <p className="text-xs font-semibold text-green-400 uppercase">Resolution Rate</p>
                            <ShieldCheck className="w-4 h-4 text-green-500" />
                        </div>
                        <p className="text-2xl font-bold text-white mt-2">{formatPercent(stats?.success_metrics.resolution_rate)}</p>
                        <p className="text-[10px] text-neutral-500 mt-1">reviewed + false positive / total</p>
                        <Description>Analistin kapattığı ya da false positive olarak işaretlediği olayların toplam alertlere oranıdır.</Description>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <Card className="lg:col-span-2 border-neutral-900 bg-[#0a0a0a]">
                    <CardHeader>
                        <CardTitle className="text-sm font-medium text-neutral-400 flex items-center gap-2">
                            <BarChart3 className="w-4 h-4 text-blue-500" /> {periodLabel} Alert Trend
                        </CardTitle>
                        <p className="text-xs text-neutral-600">Zamana göre alert yoğunluğunu gösterir; ani sıçramalar aktif tarama veya kampanya işareti olabilir.</p>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <Skeleton className="h-44 w-full" />
                        ) : normalizedTrend.every((point) => point.count === 0) ? (
                            <div className="h-44 flex items-center justify-center text-sm text-neutral-500 border border-dashed border-neutral-900 rounded-lg">
                                No trend data for this period.
                            </div>
                        ) : (
                            <TrendAreaChart points={normalizedTrend} />
                        )}
                    </CardContent>
                </Card>

                <Card className="border-neutral-900 bg-[#0a0a0a]">
                    <CardHeader>
                        <CardTitle className="text-sm font-medium text-neutral-400 flex items-center gap-2">
                            <Target className="w-4 h-4 text-red-500" /> Success Metrics
                        </CardTitle>
                        <p className="text-xs text-neutral-600">IDS tarafında başarı, engellemeden çok triage kalitesi, backlog ve kritik olay kapanışıyla okunur.</p>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {[
                            ['Containment', stats?.success_metrics.containment_rate],
                            ['Critical resolution', stats?.success_metrics.critical_resolution_rate],
                            ['Backlog pressure', stats?.success_metrics.backlog_rate],
                        ].map(([label, value]) => (
                            <div key={label as string} className="space-y-2">
                                <div className="flex justify-between text-xs">
                                    <span className="text-neutral-400">{label}</span>
                                    <span className="font-mono text-neutral-200">{formatPercent(value as number | undefined)}</span>
                                </div>
                                <div className="h-2 rounded-full bg-neutral-900 overflow-hidden">
                                    <div className="h-full bg-green-500" style={{ width: formatPercent(value as number | undefined) }} />
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Card className="border-neutral-900 bg-[#0a0a0a]">
                    <CardHeader>
                        <CardTitle className="text-sm font-medium text-neutral-400 flex items-center gap-2">
                            <BarChart3 className="w-4 h-4 text-blue-500" /> Attack Type Ratio
                        </CardTitle>
                        <p className="text-xs text-neutral-600">Saldırı sınıflarının dönem içindeki ağırlığını gösterir; hangi risk ailesine odaklanacağını söyler.</p>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {isLoading ? (
                            <Skeleton className="h-48 w-full" />
                        ) : attackTypes.length === 0 ? (
                            <div className="p-4 text-center text-sm text-neutral-500 font-mono">No attack type data available.</div>
                        ) : (
                            <>
                                <div className="h-64">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={attackTypeChart} layout="vertical" margin={{ top: 0, right: 18, left: 8, bottom: 0 }}>
                                            <CartesianGrid stroke="rgba(255,255,255,0.07)" strokeDasharray="3 3" horizontal={false} />
                                            <XAxis type="number" tick={{ fill: '#737373', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                                            <YAxis dataKey="name" type="category" width={110} tick={{ fill: '#a3a3a3', fontSize: 11 }} axisLine={false} tickLine={false} />
                                            <Tooltip
                                                content={({ active, payload }) => active && payload?.length ? (
                                                    <div className="rounded-lg border border-neutral-800 bg-black px-3 py-2 shadow-xl">
                                                        <p className="text-xs font-bold text-white">{payload[0].payload.name}</p>
                                                        <p className="text-[11px] text-blue-400">{payload[0].payload.count} hits / {payload[0].payload.ratio}%</p>
                                                    </div>
                                                ) : null}
                                            />
                                            <Bar dataKey="count" radius={[0, 6, 6, 0]}>
                                                {attackTypeChart.map((item) => <Cell key={item.name} fill={item.fill} />)}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    {attackTypeChart.slice(0, 4).map((item) => (
                                        <div key={item.name} className="rounded-lg border border-neutral-900 bg-black/30 p-3">
                                            <p className="truncate text-[11px] text-neutral-400">{item.name}</p>
                                            <p className="text-sm font-bold text-white">{item.ratio}%</p>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </CardContent>
                </Card>

                <Card className="border-neutral-900 bg-[#0a0a0a]">
                    <CardHeader>
                        <CardTitle className="text-sm font-medium text-neutral-400 flex items-center gap-2">
                            <Globe className="w-4 h-4 text-red-500" /> Top Attackers
                        </CardTitle>
                        <p className="text-xs text-neutral-600">En fazla alert üreten source IP’leri listeler; tekrar eden kaynaklar blocklist/tuning adayıdır.</p>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {isLoading ? (
                                <Skeleton className="h-48 w-full" />
                            ) : (
                                stats?.top_attackers?.map((item) => (
                                    <div key={item.ip} className="flex items-center justify-between p-3 rounded-lg bg-neutral-900/50 border border-neutral-800/50 group hover:border-red-500/30 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded bg-neutral-800 flex items-center justify-center text-[10px] text-neutral-400">
                                                {item.ip.split('.')[0]}
                                            </div>
                                            <span className="font-mono text-sm text-neutral-200">{item.ip}</span>
                                        </div>
                                        <span className="text-xs text-red-500 font-bold tabular-nums">
                                            {item.count} <span className="text-[10px] opacity-50 uppercase">Requests</span>
                                        </span>
                                    </div>
                                ))
                            )}
                            {!isLoading && (!stats?.top_attackers || stats.top_attackers.length === 0) && (
                                <div className="p-4 text-center text-sm text-neutral-500 font-mono">
                                    No attacker data available yet.
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Card className="border-neutral-900 bg-[#0a0a0a]">
                    <CardHeader>
                        <CardTitle className="text-sm font-medium text-neutral-400">Protocol Distribution</CardTitle>
                        <p className="text-xs text-neutral-600">Alertlerin hangi protokoller üzerinden geldiğini gösterir; web IDS odağında HTTP/HTTPS baskın olmalıdır.</p>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {protocolChart.length === 0 ? (
                            <div className="p-4 text-center text-sm text-neutral-500 font-mono">No protocol data available.</div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-4 items-center">
                                <div className="h-56">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie data={protocolChart} dataKey="count" nameKey="name" innerRadius={54} outerRadius={86} paddingAngle={3}>
                                                {protocolChart.map((item) => <Cell key={item.name} fill={item.fill} />)}
                                            </Pie>
                                            <Tooltip
                                                content={({ active, payload }) => active && payload?.length ? (
                                                    <div className="rounded-lg border border-neutral-800 bg-black px-3 py-2 shadow-xl">
                                                        <p className="text-xs font-bold text-white">{payload[0].payload.name}</p>
                                                        <p className="text-[11px] text-blue-400">{payload[0].value} hits</p>
                                                    </div>
                                                ) : null}
                                            />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                                <div className="space-y-2">
                                    {protocolChart.map((item) => (
                                        <div key={item.name} className="flex items-center justify-between rounded-lg border border-neutral-900 bg-black/30 px-3 py-2 text-xs">
                                            <span className="flex items-center gap-2 text-neutral-300">
                                                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.fill }} />
                                                {item.name}
                                            </span>
                                            <span className="font-mono text-neutral-500">{item.count}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card className="border-neutral-900 bg-[#0a0a0a]">
                    <CardHeader>
                        <CardTitle className="text-sm font-medium text-neutral-400">Severity Distribution</CardTitle>
                        <p className="text-xs text-neutral-600">Alertlerin önem derecesini gösterir; kritik ve yüksek değerler gerçek zamanlı triage önceliğidir.</p>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {severityEntries.length === 0 ? (
                            <div className="p-4 text-center text-sm text-neutral-500 font-mono">No severity data available.</div>
                        ) : (
                            <div className="h-56">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={severityChart} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                                        <CartesianGrid stroke="rgba(255,255,255,0.07)" strokeDasharray="3 3" vertical={false} />
                                        <XAxis dataKey="name" tick={{ fill: '#a3a3a3', fontSize: 11 }} tickLine={false} axisLine={{ stroke: 'rgba(255,255,255,0.08)' }} />
                                        <YAxis allowDecimals={false} tick={{ fill: '#737373', fontSize: 11 }} tickLine={false} axisLine={false} />
                                        <Tooltip
                                            content={({ active, payload }) => active && payload?.length ? (
                                                <div className="rounded-lg border border-neutral-800 bg-black px-3 py-2 shadow-xl">
                                                    <p className="text-xs font-bold text-white">{payload[0].payload.name}</p>
                                                    <p className="text-[11px] text-blue-400">{payload[0].value} alerts</p>
                                                </div>
                                            ) : null}
                                        />
                                        <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                                            {severityChart.map((item) => <Cell key={item.name} fill={item.fill} />)}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};
