import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Globe, Plus, ShieldBan, ShieldCheck } from 'lucide-react';
import apiClient from '../../api/client';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { toast } from 'sonner';

interface BlacklistedIP {
    id: number;
    ip_address: string;
    reason: string;
    timestamp: string;
}

export const Defense = () => {
    const queryClient = useQueryClient();
    const [newIp, setNewIp] = useState('');
    const [reason, setReason] = useState('');

    const { data: blacklist, isLoading } = useQuery({
        queryKey: ['blacklist'],
        queryFn: async () => {
            const response = await apiClient.get('/defense/blacklist');
            return response.data as BlacklistedIP[];
        }
    });

    const addMutation = useMutation({
        mutationFn: (data: { ip_address: string, reason: string }) =>
            apiClient.post('/defense/blacklist', data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['blacklist'] });
            setNewIp('');
            setReason('');
            toast.success('IP address blocked successfully.');
        },
        onError: () => toast.error('Failed to block IP.')
    });

    const removeMutation = useMutation({
        mutationFn: (ipAddress: string) => apiClient.delete(`/defense/blacklist/${ipAddress}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['blacklist'] });
            toast.info('Access restored for the selected IP.');
        }
    });

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <header>
                <h2 className="text-2xl font-bold text-white tracking-wide">Active Defense</h2>
                <p className="text-sm text-neutral-500">Manage source blocking and active response controls</p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-1 border-neutral-800">
                    <CardHeader>
                        <CardTitle className="text-blue-500 flex items-center gap-2 text-base">
                            <ShieldBan className="w-5 h-5" /> Block New Source
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <label className="text-xs text-neutral-500 mb-1.5 block uppercase tracking-wider">Target IP</label>
                            <Input placeholder="e.g. 192.168.1.1" value={newIp} onChange={(e) => setNewIp(e.target.value)} />
                        </div>
                        <div>
                            <label className="text-xs text-neutral-500 mb-1.5 block uppercase tracking-wider">Reason</label>
                            <Input placeholder="Brute force attempt..." value={reason} onChange={(e) => setReason(e.target.value)} />
                        </div>
                        <Button className="w-full" disabled={!newIp || addMutation.isPending} onClick={() => addMutation.mutate({ ip_address: newIp, reason })}>
                            <Plus className="w-4 h-4 mr-2" /> Add to Blocklist
                        </Button>
                    </CardContent>
                </Card>

                <Card className="lg:col-span-2 border-neutral-900 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-[#111]/50 border-b border-neutral-900">
                                <tr className="text-xs uppercase text-neutral-500">
                                    <th className="px-6 py-4">Blocked IP</th>
                                    <th className="px-6 py-4">Reason</th>
                                    <th className="px-6 py-4 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-900">
                                {isLoading ? (
                                    <tr><td colSpan={3} className="px-6 py-8 text-center text-neutral-600">Retrieving firewall logs...</td></tr>
                                ) : blacklist?.length === 0 ? (
                                    <tr><td colSpan={3} className="px-6 py-8 text-center text-neutral-600">No active blocks found.</td></tr>
                                ) : (
                                    blacklist?.map((item) => (
                                        <tr key={item.id} className="hover:bg-red-500/5 transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <Globe className="w-4 h-4 text-neutral-500" />
                                                    <span className="font-mono text-sm text-neutral-300">{item.ip_address}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-neutral-500">{item.reason}</td>
                                            <td className="px-6 py-4 text-right">
                                                <Button variant="ghost" size="sm" className="hover:text-green-500" onClick={() => removeMutation.mutate(item.ip_address)}>
                                                    <ShieldCheck className="w-4 h-4" />
                                                </Button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </Card>
            </div>
        </div>
    );
};
