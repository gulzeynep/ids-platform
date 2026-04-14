import { useQuery } from '@tanstack/react-query';
import { ShieldAlert, Activity, ShieldCheck, ServerCrash } from 'lucide-react';
import api from '../lib/api';

const Overview = () => {
    const { data: stats, isLoading, isError } = useQuery({
        queryKey: ['dashboard_stats'],
        queryFn: async () => {
            const response = await api.get('/alerts/stats/dashboard'); 
            return response.data;
        },
    });

    if (isLoading) return <div className="text-neutral-400 p-4">Loading neural telemetry...</div>;
    if (isError) return <div className="text-red-500 p-4">Failed to establish connection with SOC core.</div>;

    const isCompromised = stats?.status === "Compromised";
    const statusColor = isCompromised ? "text-red-500 bg-red-500/10 border-red-500/30" : "text-green-500 bg-green-500/10 border-green-500/30";

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold text-white tracking-wide">Command Center</h2>
                <p className="text-sm text-neutral-500">Real-time system telemetry and threat overview</p>
            </div>

            {/* State (Compromised / Secure) */}
            <div className={`p-4 rounded-xl border flex items-center gap-4 ${statusColor}`}>
                {isCompromised ? <ServerCrash className="w-8 h-8" /> : <ShieldCheck className="w-8 h-8" />}
                <div>
                    <h3 className="font-bold text-lg uppercase tracking-wider">System Status: {stats?.status}</h3>
                    <p className="text-sm opacity-80">
                        {isCompromised ? "Critical threats detected. Immediate triage required." : "All systems operational. No active critical threats."}
                    </p>
                </div>
            </div>

            {/* Statistic Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Total Active Threats*/}
                <div className="bg-[#0a0a0a] border border-neutral-900 p-6 rounded-xl">
                    <div className="flex items-center gap-3 text-neutral-400 mb-2">
                        <Activity className="w-5 h-5 text-blue-500" />
                        <h3 className="font-medium">Active Threats</h3>
                    </div>
                    <div className="text-4xl font-bold text-white">{stats?.active_alerts}</div>
                </div>

                {/* Critic Threats */}
                <div className="bg-[#0a0a0a] border border-neutral-900 p-6 rounded-xl">
                    <div className="flex items-center gap-3 text-neutral-400 mb-2">
                        <ShieldAlert className="w-5 h-5 text-red-500" />
                        <h3 className="font-medium">Critical Intrusions</h3>
                    </div>
                    <div className="text-4xl font-bold text-red-500">{stats?.critical_threats}</div>
                </div>

                {/* Solved */}
                <div className="bg-[#0a0a0a] border border-neutral-900 p-6 rounded-xl">
                    <div className="flex items-center gap-3 text-neutral-400 mb-2">
                        <ShieldCheck className="w-5 h-5 text-green-500" />
                        <h3 className="font-medium">Resolved Events</h3>
                    </div>
                    <div className="text-4xl font-bold text-green-500">{stats?.resolved_alerts}</div>
                </div>

            </div>
        </div>
    );
};

export default Overview;