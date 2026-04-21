import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Key, RefreshCw, Copy, ShieldCheck, Database, Server } from 'lucide-react';
import apiClient from '../../api/client';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Skeleton } from '../../components/ui/Skeleton';
import { toast } from 'sonner';

interface WorkspaceInfo {
    id: number;
    name: string;
    api_key: string;
    created_at: string;
    sensor_count: number;
}

export const Management = () => {
    const queryClient = useQueryClient();
    const [isCopying, setIsCopying] = useState(false);

    // Workspace ve API Key bilgilerini çekiyoruz
    const { data: workspace, isLoading } = useQuery({
        queryKey: ['workspace_info'],
        queryFn: async () => {
            const response = await apiClient.get('/auth/workspace/me');
            return response.data as WorkspaceInfo;
        }
    });

    // API Key Yenileme Mutation
    const rotateKeyMutation = useMutation({
        mutationFn: () => apiClient.post('/auth/workspace/rotate-key'),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['workspace_info'] });
            toast.success('API Key has been rotated successfully.');
        },
        onError: () => toast.error('Failed to rotate API Key.')
    });

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        setIsCopying(true);
        toast.info('API Key copied to clipboard.');
        setTimeout(() => setIsCopying(false), 2000);
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <header>
                <h2 className="text-2xl font-bold text-white tracking-wide">System Management</h2>
                <p className="text-sm text-neutral-500">Manage your sensors and integration keys</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* API Key Yönetimi */}
                <Card className="border-neutral-800">
                    <CardHeader>
                        <CardTitle className="text-blue-500 flex items-center gap-2 text-base">
                            <Key className="w-5 h-5" /> Sensor Integration Key
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-sm text-neutral-400">
                            This key is required for your W-IDS Python sensors to authenticate and stream logs to this workspace.
                        </p>
                        
                        <div className="relative group">
                            <Input 
                                value={isLoading ? "Loading..." : workspace?.api_key} 
                                readOnly 
                                className="pr-24 font-mono text-xs bg-black border-neutral-800 text-blue-400"
                            />
                            <div className="absolute right-1 top-1 flex gap-1">
                                <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="h-8 px-2"
                                    onClick={() => workspace && copyToClipboard(workspace.api_key)}
                                >
                                    <Copy className={`w-3.5 h-3.5 ${isCopying ? 'text-green-500' : ''}`} />
                                </Button>
                            </div>
                        </div>

                        <div className="pt-2">
                            <Button 
                                variant="danger" 
                                className="w-full text-xs"
                                isLoading={rotateKeyMutation.isPending}
                                onClick={() => rotateKeyMutation.mutate()}
                            >
                                <RefreshCw className="w-3.5 h-3.5 mr-2" /> Rotate API Key
                            </Button>
                            <p className="text-[10px] text-neutral-600 mt-2 text-center">
                                Warning: Rotating the key will disconnect all currently active sensors.
                            </p>
                        </div>
                    </CardContent>
                </Card>

                {/* Workspace Detayları */}
                <Card className="border-neutral-900">
                    <CardHeader>
                        <CardTitle className="text-neutral-300 flex items-center gap-2 text-base">
                            <Database className="w-5 h-5" /> Workspace Details
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center py-2 border-b border-neutral-900">
                                <span className="text-sm text-neutral-500">Workspace Name</span>
                                <span className="text-sm text-white font-medium">{workspace?.name || <Skeleton className="w-20 h-4" />}</span>
                            </div>
                            <div className="flex justify-between items-center py-2 border-b border-neutral-900">
                                <span className="text-sm text-neutral-500">Active Sensors</span>
                                <div className="flex items-center gap-2">
                                    <Server className="w-3.5 h-3.5 text-green-500" />
                                    <span className="text-sm text-white">{workspace?.sensor_count ?? 0} Online</span>
                                </div>
                            </div>
                            <div className="flex justify-between items-center py-2">
                                <span className="text-sm text-neutral-500">Creation Date</span>
                                <span className="text-sm text-neutral-400">
                                    {workspace ? new Date(workspace.created_at).toLocaleDateString() : <Skeleton className="w-24 h-4" />}
                                </span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

            </div>

            {/* Alt Bilgi Paneli */}
            <Card className="bg-blue-500/5 border-blue-500/20">
                <CardContent className="p-6 flex gap-4 items-start">
                    <ShieldCheck className="w-6 h-6 text-blue-500 shrink-0" />
                    <div>
                        <h4 className="text-blue-500 font-bold text-sm uppercase tracking-wider">Integration Tip</h4>
                        <p className="text-sm text-neutral-400 mt-1">
                            To connect a new sensor, use our official Python client and set the <code className="text-blue-400 bg-black px-1 rounded">WIDS_API_KEY</code> environment variable to your workspace key.
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};