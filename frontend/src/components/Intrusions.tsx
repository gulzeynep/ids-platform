import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Flag, Star, ShieldCheck, Clock, ChevronLeft, ChevronRight } from 'lucide-react';
import api from '../lib/api';

// Interface Definitions
interface Alert {
    id: number;
    type: string;
    severity: string;
    source_ip: string;
    destination_ip: string;
    protocol: string;
    status: string;
    is_flagged: boolean;
    is_saved: boolean;
    timestamp: string;
}

const Intrusions = () => {
    const queryClient = useQueryClient();

    // Advanced Filtering & Pagination States
    const [status, setStatus] = useState<string>('new');
    const [severity, setSeverity] = useState<string>('all');
    const [isFlagged, setIsFlagged] = useState<boolean | null>(null);
    const [isSaved, setIsSaved] = useState<boolean | null>(null);
    const [page, setPage] = useState<number>(0);
    const limit = 50;

    // React Query: Intelligent Data Fetching & Caching
    const { data: alerts, isLoading, isError } = useQuery({
        queryKey: ['alerts', status, severity, isFlagged, isSaved, page],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (status !== 'all') params.append('status', status);
            if (severity !== 'all') params.append('severity', severity);
            if (isFlagged !== null) params.append('is_flagged', String(isFlagged));
            if (isSaved !== null) params.append('is_saved', String(isSaved));
            params.append('limit', String(limit));
            params.append('offset', String(page * limit));

            const response = await api.get('/alerts/', { params });
            return response.data as Alert[];
        }
    });

    // Universal Triage Engine (Backend exclude_unset=True integration)
    const triageMutation = useMutation({
        mutationFn: async ({ id, data }: { id: number, data: any }) => {
            await api.patch(`/alerts/${id}/triage`, data);
        },
        onSuccess: () => {
            // Silently refresh the datatable without loading screens
            queryClient.invalidateQueries({ queryKey: ['alerts'] });
        }
    });

    // Action Handlers
    const toggleFlag = (id: number, current: boolean) => triageMutation.mutate({ id, data: { is_flagged: !current } });
    const toggleSave = (id: number, current: boolean) => triageMutation.mutate({ id, data: { is_saved: !current } });
    const toggleStatus = (id: number, current: string) => {
        const newStatus = current === 'new' ? 'reviewed' : 'new';
        triageMutation.mutate({ id, data: { status: newStatus } });
    };

    // UI Helper: Strict Corporate Severity Colors
    const getSeverityColor = (sev: string) => {
        switch(sev.toLowerCase()) {
            case 'critical': return 'text-red-500 bg-red-500/10 border-red-500/20';
            case 'high': return 'text-orange-500 bg-orange-500/10 border-orange-500/20';
            case 'medium': return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20';
            default: return 'text-blue-500 bg-blue-500/10 border-blue-500/20';
        }
    };

    return (
        <div className="space-y-6">
            {/* Header Section */}
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-white tracking-wide">Intrusion Events</h2>
                    <p className="text-sm text-neutral-500">Monitor and triage incoming security threats</p>
                </div>
            </div>

            {/* Filter Command Bar */}
            <div className="flex flex-wrap gap-4 p-4 bg-[#0a0a0a] border border-neutral-900 rounded-xl">
                <select 
                    value={status} 
                    onChange={(e) => { setStatus(e.target.value); setPage(0); }}
                    className="bg-[#111] border border-neutral-800 text-neutral-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                >
                    <option value="new">Active Threats (New)</option>
                    <option value="reviewed">Resolved (Reviewed)</option>
                    <option value="all">All Events</option>
                </select>

                <select 
                    value={severity} 
                    onChange={(e) => { setSeverity(e.target.value); setPage(0); }}
                    className="bg-[#111] border border-neutral-800 text-neutral-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                >
                    <option value="all">All Severities</option>
                    <option value="critical">Critical</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                </select>

                <button 
                    onClick={() => { setIsFlagged(isFlagged ? null : true); setPage(0); }}
                    className={`flex items-center gap-2 px-3 py-2 text-sm rounded-lg border transition-colors ${isFlagged ? 'bg-red-500/10 border-red-500/50 text-red-500' : 'bg-[#111] border-neutral-800 text-neutral-400 hover:text-white'}`}
                >
                    <Flag className="w-4 h-4" /> Flagged
                </button>

                <button 
                    onClick={() => { setIsSaved(isSaved ? null : true); setPage(0); }}
                    className={`flex items-center gap-2 px-3 py-2 text-sm rounded-lg border transition-colors ${isSaved ? 'bg-yellow-500/10 border-yellow-500/50 text-yellow-500' : 'bg-[#111] border-neutral-800 text-neutral-400 hover:text-white'}`}
                >
                    <Star className="w-4 h-4" /> Saved
                </button>
            </div>

            {/* Datatable Wrapper */}
            <div className="bg-[#0a0a0a] border border-neutral-900 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-neutral-900 bg-[#111]/50 text-xs uppercase tracking-wider text-neutral-500">
                                <th className="px-6 py-4 font-medium">Timestamp</th>
                                <th className="px-6 py-4 font-medium">Event Type</th>
                                <th className="px-6 py-4 font-medium">Severity</th>
                                <th className="px-6 py-4 font-medium">Source IP</th>
                                <th className="px-6 py-4 font-medium text-right">Triage Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-900">
                            {isLoading ? (
                                <tr><td colSpan={5} className="px-6 py-8 text-center text-neutral-500">Scanning neural databanks...</td></tr>
                            ) : isError ? (
                                <tr><td colSpan={5} className="px-6 py-8 text-center text-red-500">Failed to retrieve intelligence data.</td></tr>
                            ) : alerts?.length === 0 ? (
                                <tr><td colSpan={5} className="px-6 py-8 text-center text-neutral-500">No security events found.</td></tr>
                            ) : (
                                alerts?.map((alert) => (
                                    <tr key={alert.id} className="hover:bg-[#111]/50 transition-colors">
                                        <td className="px-6 py-4 text-sm text-neutral-400 font-mono">
                                            {new Date(alert.timestamp).toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-neutral-200">{alert.type}</div>
                                            <div className="text-xs text-neutral-500 mt-0.5">{alert.protocol}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2.5 py-1 rounded border text-xs font-medium uppercase tracking-wider ${getSeverityColor(alert.severity)}`}>
                                                {alert.severity}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm font-mono text-neutral-300">
                                            {alert.source_ip}
                                        </td>
                                        <td className="px-6 py-4 flex items-center justify-end gap-3">
                                            <button 
                                                onClick={() => toggleFlag(alert.id, alert.is_flagged)}
                                                className={`p-1.5 rounded-md transition-colors ${alert.is_flagged ? 'bg-red-500/20 text-red-500' : 'text-neutral-500 hover:text-white hover:bg-neutral-800'}`}
                                                title="Toggle Flag"
                                            >
                                                <Flag className="w-4 h-4" />
                                            </button>
                                            <button 
                                                onClick={() => toggleSave(alert.id, alert.is_saved)}
                                                className={`p-1.5 rounded-md transition-colors ${alert.is_saved ? 'bg-yellow-500/20 text-yellow-500' : 'text-neutral-500 hover:text-white hover:bg-neutral-800'}`}
                                                title="Save/Star"
                                            >
                                                <Star className="w-4 h-4" />
                                            </button>
                                            <button 
                                                onClick={() => toggleStatus(alert.id, alert.status)}
                                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md border text-xs font-medium transition-colors ${
                                                    alert.status === 'reviewed' 
                                                    ? 'bg-neutral-900 border-neutral-700 text-neutral-400 hover:text-white' 
                                                    : 'bg-blue-600/10 border-blue-500/30 text-blue-400 hover:bg-blue-600/20'
                                                }`}
                                            >
                                                {alert.status === 'reviewed' ? (
                                                    <><Clock className="w-3.5 h-3.5" /> Re-open</>
                                                ) : (
                                                    <><ShieldCheck className="w-3.5 h-3.5" /> Resolve</>
                                                )}
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
                
                {/* Pagination Framework */}
                <div className="flex items-center justify-between px-6 py-4 border-t border-neutral-900 bg-[#0a0a0a]">
                    <div className="text-xs text-neutral-500 font-mono">
                        Showing records {page * limit + (alerts?.length ? 1 : 0)} to {page * limit + (alerts?.length || 0)}
                    </div>
                    <div className="flex gap-2">
                        <button 
                            onClick={() => setPage(p => Math.max(0, p - 1))}
                            disabled={page === 0 || isLoading}
                            className="p-1.5 border border-neutral-800 rounded text-neutral-400 hover:text-white hover:bg-neutral-900 disabled:opacity-50 transition-colors"
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                        <button 
                            onClick={() => setPage(p => p + 1)}
                            disabled={alerts?.length !== limit || isLoading}
                            className="p-1.5 border border-neutral-800 rounded text-neutral-400 hover:text-white hover:bg-neutral-900 disabled:opacity-50 transition-colors"
                        >
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Intrusions;