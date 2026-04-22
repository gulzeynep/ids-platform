import { useQuery } from '@tanstack/react-query';
import { Globe, TrendingUp, Skull, ShieldAlert, BarChart3, Fingerprint } from 'lucide-react';
import apiClient from '../../api/client';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Skeleton } from '../../components/ui/Skeleton';


interface IntelligenceStats {
    top_attack_types: { type: string; count: number }[];
    top_malicious_ips: { ip: string; country: string; count: number }[];
    monthly_trend: number; // Örn: %15 artış
    total_unique_attackers: number;
}

export const Intelligence = () => {
    const { data: stats, isLoading } = useQuery({
        queryKey: ['intelligence_stats'],
        queryFn: async () => {
            const response = await apiClient.get('/alerts/intelligence-summary');
            return response.data as IntelligenceStats;
        },
        refetchInterval: 30000 
    });

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Header */}
            <div>
                <h2 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
                    <Fingerprint className="text-blue-500 w-8 h-8" /> Threat Intelligence
                </h2>
                <p className="text-neutral-500 mt-1 font-mono text-sm">
                    &gt; analyzing long-term patterns and adversarial behaviors...
                </p>
            </div>

            {/* İstatistik Özetleri */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="bg-blue-500/5 border-blue-500/20">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <p className="text-xs font-semibold text-blue-400 uppercase">Monthly Trend</p>
                            <TrendingUp className="w-4 h-4 text-blue-500" />
                        </div>
                        <p className="text-2xl font-bold text-white mt-2">+{stats?.monthly_trend || 0}%</p>
                    </CardContent>
                </Card>
                <Card className="bg-red-500/5 border-red-900/20">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <p className="text-xs font-semibold text-red-400 uppercase">Unique Attackers</p>
                            <Skull className="w-4 h-4 text-red-500" />
                        </div>
                        <p className="text-2xl font-bold text-white mt-2">{stats?.total_unique_attackers || 0}</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Saldırı Tipi Dağılımı */}
                <Card className="border-neutral-900 bg-[#0a0a0a]">
                    <CardHeader>
                        <CardTitle className="text-sm font-medium text-neutral-400 flex items-center gap-2">
                            <BarChart3 className="w-4 h-4 text-blue-500" /> Top Vector Distribution
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {isLoading ? (
                            <Skeleton className="h-40 w-full" />
                        ) : (
                            stats?.top_attack_types.map((item, idx) => (
                                <div key={idx} className="space-y-2">
                                    <div className="flex justify-between text-xs font-mono">
                                        <span className="text-neutral-300">{item.type}</span>
                                        <span className="text-neutral-500">{item.count} hits</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-neutral-900 rounded-full overflow-hidden">
                                        <div 
                                            className="h-full bg-blue-600 transition-all duration-1000" 
                                            style={{ width: `${(item.count / 1000) * 100}%` }} 
                                        />
                                    </div>
                                </div>
                            ))
                        )}
                    </CardContent>
                </Card>

                {/* En Aktif Saldırganlar */}
                <Card className="border-neutral-900 bg-[#0a0a0a]">
                    <CardHeader>
                        <CardTitle className="text-sm font-medium text-neutral-400 flex items-center gap-2">
                            <Globe className="w-4 h-4 text-red-500" /> Malicious Origin Pulse
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {stats?.top_malicious_ips.map((ip, idx) => (
                                <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-neutral-900/50 border border-neutral-800/50 group hover:border-red-500/30 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded bg-neutral-800 flex items-center justify-center text-[10px] text-neutral-400">
                                            {ip.country}
                                        </div>
                                        <span className="font-mono text-sm text-neutral-200">{ip.ip}</span>
                                    </div>
                                    <span className="text-xs text-red-500 font-bold tabular-nums">
                                        {ip.count} <span className="text-[10px] opacity-50 uppercase">Requests</span>
                                    </span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
            
            {/* Alt Bilgi - Log Notu */}
            <div className="p-4 bg-neutral-900/30 border border-neutral-800 rounded-lg">
                <p className="text-xs text-neutral-600 italic">
                    Note: Long-term data is aggregated every 24 hours. Data reflects normalized traffic patterns across all integrated sensors.
                </p>
            </div>
        </div>
    );
};