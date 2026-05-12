import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Globe, TrendingUp, Skull, BarChart3, Fingerprint, Target, ShieldCheck } from 'lucide-react';
import { alertsApi } from '../../api/endpoints/alerts';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Skeleton } from '../../components/ui/Skeleton';
import { Button } from '../../components/ui/Button';
import type { IntelligenceStats, TrendPoint } from '../../types';

type Period = 'week' | 'month';

const formatPercent = (value: number | undefined) => `${Math.round((value ?? 0) * 100)}%`;

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
    const width = 640;
    const height = 220;
    const padding = { top: 18, right: 18, bottom: 42, left: 42 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;
    const maxValue = Math.max(...points.map((point) => point.count), 1);
    const xFor = (index: number) => padding.left + (points.length <= 1 ? chartWidth : (index / (points.length - 1)) * chartWidth);
    const yFor = (count: number) => padding.top + chartHeight - (count / maxValue) * chartHeight;
    const line = points.map((point, index) => `${xFor(index)},${yFor(point.count)}`).join(' ');
    const area = `${padding.left},${padding.top + chartHeight} ${line} ${padding.left + chartWidth},${padding.top + chartHeight}`;
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
            <div className="relative overflow-hidden rounded-lg border border-neutral-900 bg-black/30">
                <svg viewBox={`0 0 ${width} ${height}`} className="h-64 w-full" role="img" aria-label="Alert trend area chart">
                    {[0, 0.25, 0.5, 0.75, 1].map((tick) => {
                        const y = padding.top + chartHeight - tick * chartHeight;
                        return (
                            <g key={tick}>
                                <line x1={padding.left} x2={padding.left + chartWidth} y1={y} y2={y} stroke="rgba(255,255,255,0.06)" />
                                <text x={12} y={y + 4} fill="#737373" fontSize="10">{Math.round(maxValue * tick)}</text>
                            </g>
                        );
                    })}
                    <polygon points={area} fill="rgba(37, 99, 235, 0.18)" />
                    <polyline points={line} fill="none" stroke="#3b82f6" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
                    {points.map((point, index) => (
                        <g key={`${point.label}-${index}`}>
                            <circle cx={xFor(index)} cy={yFor(point.count)} r="4" fill="#0a0a0a" stroke="#60a5fa" strokeWidth="2">
                                <title>{`${point.label}: ${point.count} alerts`}</title>
                            </circle>
                            {point.shortLabel && (
                                <text x={xFor(index)} y={height - 16} textAnchor="middle" fill="#737373" fontSize="10">
                                    {point.shortLabel}
                                </text>
                            )}
                        </g>
                    ))}
                </svg>
            </div>
        </div>
    );
};

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
                    </CardContent>
                </Card>
                <Card className="bg-red-500/5 border-red-900/20">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <p className="text-xs font-semibold text-red-400 uppercase">Unique Attackers</p>
                            <Skull className="w-4 h-4 text-red-500" />
                        </div>
                        <p className="text-2xl font-bold text-white mt-2">{isLoading ? '...' : stats?.unique_attackers ?? 0}</p>
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
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <Card className="lg:col-span-2 border-neutral-900 bg-[#0a0a0a]">
                    <CardHeader>
                        <CardTitle className="text-sm font-medium text-neutral-400 flex items-center gap-2">
                            <BarChart3 className="w-4 h-4 text-blue-500" /> {periodLabel} Alert Trend
                        </CardTitle>
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
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {isLoading ? (
                            <Skeleton className="h-48 w-full" />
                        ) : attackTypes.length === 0 ? (
                            <div className="p-4 text-center text-sm text-neutral-500 font-mono">No attack type data available.</div>
                        ) : attackTypes.map((item) => (
                            <div key={item.type} className="space-y-2">
                                <div className="flex justify-between text-xs font-mono">
                                    <span className="text-neutral-300 truncate pr-4">{item.type}</span>
                                    <span className="text-neutral-500">{item.count} hits / {formatPercent(item.ratio)}</span>
                                </div>
                                <div className="h-2 w-full bg-neutral-900 rounded-full overflow-hidden">
                                    <div className="h-full bg-red-500 transition-all duration-1000" style={{ width: `${Math.max(4, Math.round(item.ratio * 100))}%` }} />
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>

                <Card className="border-neutral-900 bg-[#0a0a0a]">
                    <CardHeader>
                        <CardTitle className="text-sm font-medium text-neutral-400 flex items-center gap-2">
                            <Globe className="w-4 h-4 text-red-500" /> Top Attackers
                        </CardTitle>
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
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {protocolEntries.map(([protocol, count]) => (
                            <div key={protocol} className="space-y-2">
                                <div className="flex justify-between text-xs font-mono">
                                    <span className="text-neutral-300">{protocol.toUpperCase()}</span>
                                    <span className="text-neutral-500">{count} hits</span>
                                </div>
                                <div className="h-1.5 w-full bg-neutral-900 rounded-full overflow-hidden">
                                    <div className="h-full bg-blue-600 transition-all duration-1000" style={{ width: `${Math.max(4, Math.round((stats?.protocol_share?.[protocol] ?? 0) * 100))}%` }} />
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>

                <Card className="border-neutral-900 bg-[#0a0a0a]">
                    <CardHeader>
                        <CardTitle className="text-sm font-medium text-neutral-400">Severity Distribution</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-2 gap-3">
                        {severityEntries.length === 0 ? (
                            <div className="col-span-2 p-4 text-center text-sm text-neutral-500 font-mono">No severity data available.</div>
                        ) : severityEntries.map(([severity, count]) => (
                            <div key={severity} className="rounded-lg border border-neutral-900 bg-black/30 p-4">
                                <p className="text-[10px] uppercase text-neutral-500">{severity}</p>
                                <p className="mt-1 text-2xl font-bold text-white">{count}</p>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};
