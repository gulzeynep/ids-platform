import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import api from '../lib/api';
import { useAuthStore } from '../lib/store';
import { ShieldAlert, Clock, Globe, Loader2 } from 'lucide-react';

const Intrusions = () => {
  const queryClient = useQueryClient();
  const token = useAuthStore((state) => state.token);
  // Assume we store user info in another state or decode from token
  const workspaceId = 1; 

  // 1. Fetch data with TanStack Query
  const { data: alerts, isLoading } = useQuery({
    queryKey: ['alerts'],
    queryFn: async () => {
      const response = await api.get('/alerts/recent');
      return response.data;
    }
  });

  // 2. Real-time update with WebSockets
  useEffect(() => {
    if (!token) return;

    const socket = new WebSocket(`ws://localhost:8000/ws/stream/${workspaceId}`);

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.event_type === 'new_intrusion') {
        // Manually invalidate the cache to trigger a fresh background fetch
        queryClient.invalidateQueries({ queryKey: ['alerts'] });
        
        // Optional: Show a toast notification here
        console.log("New threat detected:", data.source_ip);
      }
    };

    return () => socket.close();
  }, [token, queryClient, workspaceId]);

  if (isLoading) return <Loader2 className="animate-spin" />;

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-white flex items-center gap-2">
        <ShieldAlert className="text-red-500" /> Recent Intrusions
      </h2>
      <div className="grid gap-3">
        {alerts?.map((alert: any) => (
          <div key={alert.id} className="bg-slate-900 border-l-4 border-red-500 p-4 rounded-r-lg flex justify-between items-center">
            <div>
              <div className="text-white font-mono">{alert.source_ip} ➔ {alert.type}</div>
              <div className="text-slate-500 text-xs flex items-center gap-1">
                <Clock className="w-3 h-3" /> {new Date(alert.timestamp).toLocaleString()}
              </div>
            </div>
            <div className="bg-red-500/10 text-red-500 px-3 py-1 rounded-full text-xs font-bold uppercase">
              {alert.severity}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Intrusions;