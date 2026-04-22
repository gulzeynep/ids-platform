import { useAlertsStore } from '../../stores/alerts.store';
import { Card } from '../../components/ui/Card';
import { Bell, ShieldAlert, Clock, Info } from 'lucide-react';

export const Notifications = () => {
  const { realtimeAlerts } = useAlertsStore();

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between border-b border-neutral-900 pb-4">
        <h2 className="text-2xl font-bold text-white flex items-center gap-3 italic">
          <Bell className="text-blue-500" /> EVENT_LOG_STREAM
        </h2>
      </div>

      <div className="space-y-3">
        {realtimeAlerts.length === 0 ? (
          <div className="py-20 text-center border border-dashed border-neutral-800 rounded-2xl">
            <Info className="w-8 h-8 text-neutral-700 mx-auto mb-3" />
            <p className="text-neutral-500 font-mono text-sm">No new data packets received in current session.</p>
          </div>
        ) : (
          realtimeAlerts.map((alert, idx) => (
            <Card key={idx} className="bg-black/40 border-neutral-900 hover:border-blue-500/30 transition-colors">
              <div className="p-4 flex gap-4">
                <div className={`p-2 rounded-lg h-fit ${alert.severity === 'critical' ? 'bg-red-500/10 text-red-500' : 'bg-blue-500/10 text-blue-500'}`}>
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <p className="text-sm font-bold text-neutral-200 uppercase tracking-tighter">{alert.type}</p>
                    <span className="text-[10px] text-neutral-600 font-mono">{new Date(alert.timestamp).toLocaleTimeString()}</span>
                  </div>
                  <p className="text-xs text-neutral-500 mt-1">Source: <span className="text-blue-400 font-mono">{alert.source_ip}</span> | Protocol: {alert.protocol}</p>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};