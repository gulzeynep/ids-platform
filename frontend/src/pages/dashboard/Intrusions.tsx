import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Flag, ShieldCheck, Search, ChevronLeft, ChevronRight, X, FileSearch, Radio } from 'lucide-react';
import { alertsApi, alertKeys } from '../../api/endpoints/alerts';
import { useAlertsStore } from '../../stores/alerts.store';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { getAlertTitle } from '../../utils/alertTitles';

export const Intrusions = () => {
  const queryClient = useQueryClient();
  const { filters, setFilters } = useAlertsStore();
  const [page, setPage] = useState(0);
  const [selectedAlertId, setSelectedAlertId] = useState<number | null>(null);
  const limit = 50;


  const { data: alerts, isLoading } = useQuery({
    queryKey: alertKeys.list(filters, page),
    queryFn: () => alertsApi.getAlerts(filters, page, limit),
    refetchInterval: 5000,
    refetchIntervalInBackground: true,
  });

  const { data: selectedAlert } = useQuery({
    queryKey: selectedAlertId ? alertKeys.detail(selectedAlertId) : ['alerts', 'detail', 'none'],
    queryFn: () => alertsApi.getAlert(selectedAlertId as number),
    enabled: selectedAlertId !== null,
    refetchInterval: selectedAlertId ? 10000 : false,
  });


  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) =>
      alertsApi.updateAlert(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: alertKeys.all });
    },
  });

  const getSeverityColor = (sev: string) => {
    switch (sev.toLowerCase()) {
      case 'critical': return 'text-red-500 bg-red-500/10 border-red-500/20';
      case 'high': return 'text-orange-500 bg-orange-500/10 border-orange-500/20';
      default: return 'text-blue-500 bg-blue-500/10 border-blue-500/20';
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <header>
        <h2 className="text-2xl font-bold text-white tracking-wide">Intrusion Events</h2>
        <p className="text-sm text-neutral-500">Monitor and triage incoming network threats</p>
      </header>

      {/* Filtre  */}
      <Card className="p-4 flex flex-wrap gap-4 items-center border-neutral-800 bg-[#0a0a0a]">
        <div className="relative flex-1 min-w-[250px]">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-neutral-500" />
          <Input 
            placeholder="Search by Source IP or Attack Type..." 
            className="pl-10"
            onChange={(e) => setFilters({ search: e.target.value })}
          />
        </div>
        
        <select 
          className="bg-[#111] border border-neutral-800 text-sm rounded-lg px-3 h-10 text-neutral-300 focus:ring-2 focus:ring-blue-500 outline-none"
          onChange={(e) => setFilters({ severity: e.target.value as any })}
        >
          <option value="all">All Severities</option>
          <option value="critical">Critical Only</option>
          <option value="high">High & Above</option>
        </select>

        <Button 
          variant={filters.is_flagged ? "danger" : "secondary"}
          onClick={() => setFilters({ is_flagged: !filters.is_flagged })}
        >
          <Flag className={`w-4 h-4 mr-2 ${filters.is_flagged ? 'fill-current' : ''}`} />
          Flagged
        </Button>
      </Card>

      {/* Veri Tablosu */}
      <Card className="overflow-hidden border-neutral-900">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-[#111]/50 border-b border-neutral-900">
              <tr className="text-xs uppercase text-neutral-500 tracking-wider">
                <th className="px-6 py-4 font-medium">Timestamp</th>
                <th className="px-6 py-4 font-medium">Alert Title</th>
                <th className="px-6 py-4 font-medium">Severity</th>
                <th className="px-6 py-4 font-medium">Source IP</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-900">
              {isLoading ? (
                <tr><td colSpan={5} className="px-6 py-8 text-center text-neutral-500">Scanning neural databanks...</td></tr>
              ) : alerts?.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-8 text-center text-neutral-500">No security events found.</td></tr>
              ) : (
                alerts?.map((alert) => (
                  <tr key={alert.id} className="hover:bg-neutral-900/30 transition-colors group cursor-pointer" onClick={() => setSelectedAlertId(alert.id)}>
                    <td className="px-6 py-4 text-sm font-mono text-neutral-500">
                      {new Date(alert.timestamp).toLocaleTimeString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-neutral-100">{getAlertTitle(alert)}</div>
                      <div className="text-xs text-neutral-500 font-mono">{alert.type} / {alert.protocol}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 rounded border text-[10px] font-bold uppercase tracking-tighter ${getSeverityColor(alert.severity)}`}>
                        {alert.severity}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-mono text-neutral-400">
                      {alert.source_ip}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={(event) => {
                          event.stopPropagation();
                          updateMutation.mutate({ id: alert.id, data: { status: 'reviewed' } });
                        }}
                        title="Mark as Resolved"
                      >
                        <ShieldCheck className="w-4 h-4 text-neutral-500 group-hover:text-green-500 transition-colors" />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Sayfalama */}
        <div className="p-4 border-t border-neutral-900 flex justify-between items-center bg-[#0a0a0a]">
          <span className="text-xs text-neutral-600 font-mono">
            Showing {alerts?.length || 0} records
          </span>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button 
            variant="secondary" 
            size="sm" 
            onClick={() => setPage(p => p + 1)} 
            disabled={(alerts?.length ?? 0) < limit || isLoading}
            >
            <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </Card>

      {selectedAlert && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-3xl bg-[#080808] border border-white/10 rounded-lg shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-white/10">
              <div>
                <h3 className="text-sm font-bold text-white">{getAlertTitle(selectedAlert)}</h3>
                <p className="text-[10px] text-neutral-500 font-mono">EVENT_ID: {selectedAlert.event_id || 'not captured'}</p>
              </div>
              <button onClick={() => setSelectedAlertId(null)} className="text-neutral-500 hover:text-white"><X size={18} /></button>
            </div>
            <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="space-y-3">
                <div className="p-3 bg-black border border-neutral-900 rounded-lg">
                  <p className="text-[10px] uppercase text-neutral-600 mb-1">Why did this fire?</p>
                  <p className="text-neutral-300">{selectedAlert.payload_preview?.match(/^\[([^\]]+)\]/)?.[1] || selectedAlert.type}</p>
                </div>
                <div className="p-3 bg-black border border-neutral-900 rounded-lg">
                  <p className="text-[10px] uppercase text-neutral-600 mb-1">Flow</p>
                  <p className="font-mono text-neutral-300">{selectedAlert.source_ip}:{selectedAlert.source_port || '*'} {'->'} {selectedAlert.destination_ip}:{selectedAlert.destination_port || '*'}</p>
                </div>
              </div>
              <div className="space-y-3">
                <div className="p-3 bg-blue-500/[0.04] border border-blue-500/20 rounded-lg">
                  <p className="text-[10px] uppercase text-blue-400 mb-2 flex items-center gap-2"><FileSearch size={14} /> Event-Based Capture</p>
                  <p className="text-xs text-neutral-400">Mode: {selectedAlert.capture_mode || 'metadata only'}</p>
                  <p className="text-xs text-neutral-400">Window: {selectedAlert.capture_window_seconds || 10}s</p>
                  <p className="text-xs text-neutral-400 break-all">Path: {selectedAlert.capture_path || '/var/log/snort/event_captures'}</p>
                </div>
                <div className="p-3 bg-black border border-neutral-900 rounded-lg">
                  <p className="text-[10px] uppercase text-neutral-600 mb-1 flex items-center gap-2"><Radio size={14} /> Packet filter</p>
                  <p className="font-mono text-xs text-neutral-300 break-all">{selectedAlert.packet_filter || 'No packet filter recorded.'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
