import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Flag, ShieldCheck, Search, ChevronLeft, ChevronRight, X, FileSearch, Radio, Fingerprint, Bookmark, RotateCcw, ShieldQuestion, CircleCheck, MessageSquare } from 'lucide-react';
import { alertsApi, alertKeys } from '../../api/endpoints/alerts';
import { useAlertsStore } from '../../stores/alerts.store';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { getAlertTitle } from '../../utils/alertTitles';
import type { AlertSeverity, AlertStatus, AlertUpdateDto } from '../../types';

export const Intrusions = () => {
  const queryClient = useQueryClient();
  const { filters, setFilters, resetFilters } = useAlertsStore();
  const [page, setPage] = useState(0);
  const [selectedAlertId, setSelectedAlertId] = useState<number | null>(null);
  const [notesDraft, setNotesDraft] = useState('');
  const limit = 50;

  useEffect(() => {
    resetFilters();
    setPage(0);
  }, [resetFilters]);


  const { data: alerts, isLoading, error: alertsError } = useQuery({
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
    mutationFn: ({ id, data }: { id: number; data: AlertUpdateDto }) =>
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'reviewed': return 'text-green-400 bg-green-500/10 border-green-500/20';
      case 'reviewing': return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
      case 'false_positive': return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20';
      default: return 'text-neutral-300 bg-neutral-500/10 border-neutral-700';
    }
  };

  const selectAlert = (id: number, notes: string | null) => {
    setSelectedAlertId(id);
    setNotesDraft(notes ?? '');
  };

  const updateSelectedAlert = (data: AlertUpdateDto) => {
    if (!selectedAlertId) {
      return;
    }
    updateMutation.mutate({ id: selectedAlertId, data });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <header>
        <h2 className="text-2xl font-bold text-white tracking-wide">Intrusion Events</h2>
        <p className="text-sm text-neutral-500">Monitor, retain, and triage historical IDS events</p>
      </header>

      {alertsError && (
        <Card className="p-4 border-red-500/30 bg-red-500/10 text-red-300 text-sm">
          Alert history could not be loaded. Your session may be expired or the backend is unavailable.
        </Card>
      )}

      {/* Filtre  */}
      <Card className="p-4 flex flex-wrap gap-4 items-center border-neutral-800 bg-[#0a0a0a]">
        <div className="relative flex-1 min-w-[250px]">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-neutral-500" />
          <Input 
            placeholder="Search by Source IP or Attack Type..." 
            className="pl-10"
            value={filters.search || ''}
            onChange={(e) => setFilters({ search: e.target.value })}
          />
        </div>

        <select
          className="bg-[#111] border border-neutral-800 text-sm rounded-lg px-3 h-10 text-neutral-300 focus:ring-2 focus:ring-blue-500 outline-none"
          value={filters.status || 'new'}
          onChange={(e) => setFilters({ status: e.target.value as AlertStatus | 'all' })}
        >
          <option value="all">All Statuses</option>
          <option value="new">New</option>
          <option value="reviewing">Reviewing</option>
          <option value="reviewed">Reviewed</option>
          <option value="false_positive">False Positive</option>
        </select>
        
        <select 
          className="bg-[#111] border border-neutral-800 text-sm rounded-lg px-3 h-10 text-neutral-300 focus:ring-2 focus:ring-blue-500 outline-none"
          value={filters.severity || 'all'}
          onChange={(e) => setFilters({ severity: e.target.value as AlertSeverity | 'all' })}
        >
          <option value="all">All Severities</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>

        <Input
          type="datetime-local"
          className="max-w-[210px]"
          value={filters.start_date || ''}
          onChange={(e) => setFilters({ start_date: e.target.value || undefined })}
        />
        <Input
          type="datetime-local"
          className="max-w-[210px]"
          value={filters.end_date || ''}
          onChange={(e) => setFilters({ end_date: e.target.value || undefined })}
        />

        <Button 
          variant={filters.is_flagged ? "danger" : "secondary"}
          onClick={() => setFilters({ is_flagged: !filters.is_flagged })}
        >
          <Flag className={`w-4 h-4 mr-2 ${filters.is_flagged ? 'fill-current' : ''}`} />
          Flagged
        </Button>
        <Button
          variant="secondary"
          onClick={() => {
            setFilters({
              status: 'all',
              severity: 'all',
              is_flagged: null,
              is_saved: null,
              search: '',
              start_date: undefined,
              end_date: undefined,
            });
            setPage(0);
          }}
        >
          Show History
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
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium">Source IP</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-900">
              {isLoading ? (
                <tr><td colSpan={6} className="px-6 py-8 text-center text-neutral-500">Scanning neural databanks...</td></tr>
              ) : alerts?.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-8 text-center text-neutral-500">No security events match the current filters. Use Show History to view retained IDS alerts.</td></tr>
              ) : (
                alerts?.map((alert) => (
                  <tr key={alert.id} className="hover:bg-neutral-900/30 transition-colors group cursor-pointer" onClick={() => selectAlert(alert.id, alert.notes)}>
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
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 rounded border text-[10px] font-bold uppercase tracking-tighter ${getStatusColor(alert.status)}`}>
                        {alert.status.replace('_', ' ')}
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
                          updateMutation.mutate({ id: alert.id, data: { status: alert.status === 'reviewed' ? 'new' : 'reviewed' } });
                        }}
                        title={alert.status === 'reviewed' ? 'Move back to New' : 'Mark as Reviewed'}
                      >
                        {alert.status === 'reviewed' ? (
                          <RotateCcw className="w-4 h-4 text-neutral-500 group-hover:text-yellow-500 transition-colors" />
                        ) : (
                          <ShieldCheck className="w-4 h-4 text-neutral-500 group-hover:text-green-500 transition-colors" />
                        )}
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
          <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-[#080808] border border-white/10 rounded-lg shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-white/10">
              <div>
                <h3 className="text-sm font-bold text-white">{getAlertTitle(selectedAlert)}</h3>
                <p className="text-[10px] text-neutral-500 font-mono">EVENT_ID: {selectedAlert.event_id || 'not captured'}</p>
              </div>
              <button onClick={() => setSelectedAlertId(null)} className="text-neutral-500 hover:text-white"><X size={18} /></button>
            </div>
            <div className="p-5 border-b border-white/10 space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`px-2 py-1 rounded border text-[10px] font-bold uppercase tracking-tighter ${getStatusColor(selectedAlert.status)}`}>
                  {selectedAlert.status.replace('_', ' ')}
                </span>
                <Button
                  size="sm"
                  variant={selectedAlert.status === 'reviewed' ? 'secondary' : 'primary'}
                  onClick={() => updateSelectedAlert({ status: selectedAlert.status === 'reviewed' ? 'new' : 'reviewed' })}
                  isLoading={updateMutation.isPending}
                >
                  {selectedAlert.status === 'reviewed' ? <RotateCcw className="w-4 h-4 mr-2" /> : <CircleCheck className="w-4 h-4 mr-2" />}
                  {selectedAlert.status === 'reviewed' ? 'Unreview' : 'Review'}
                </Button>
                <Button size="sm" variant="secondary" onClick={() => updateSelectedAlert({ status: 'reviewing' })} isLoading={updateMutation.isPending}>
                  <ShieldQuestion className="w-4 h-4 mr-2" /> Investigating
                </Button>
                <Button size="sm" variant="secondary" onClick={() => updateSelectedAlert({ status: 'false_positive' })} isLoading={updateMutation.isPending}>
                  False Positive
                </Button>
                <Button size="sm" variant={selectedAlert.is_flagged ? 'danger' : 'secondary'} onClick={() => updateSelectedAlert({ is_flagged: !selectedAlert.is_flagged })} isLoading={updateMutation.isPending}>
                  <Flag className={`w-4 h-4 mr-2 ${selectedAlert.is_flagged ? 'fill-current' : ''}`} /> {selectedAlert.is_flagged ? 'Unflag' : 'Flag'}
                </Button>
                <Button size="sm" variant={selectedAlert.is_saved ? 'primary' : 'secondary'} onClick={() => updateSelectedAlert({ is_saved: !selectedAlert.is_saved })} isLoading={updateMutation.isPending}>
                  <Bookmark className={`w-4 h-4 mr-2 ${selectedAlert.is_saved ? 'fill-current' : ''}`} /> {selectedAlert.is_saved ? 'Saved' : 'Save'}
                </Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-3">
                <label className="sr-only" htmlFor="alert-notes">Analyst notes</label>
                <textarea
                  id="alert-notes"
                  value={notesDraft}
                  onChange={(event) => setNotesDraft(event.target.value)}
                  className="min-h-20 rounded-lg border border-neutral-800 bg-black/50 px-3 py-2 text-sm text-neutral-200 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30"
                  placeholder="Add analyst notes..."
                />
                <Button
                  variant="secondary"
                  className="h-full min-h-20"
                  onClick={() => updateSelectedAlert({ notes: notesDraft })}
                  isLoading={updateMutation.isPending}
                >
                  <MessageSquare className="w-4 h-4 mr-2" /> Save Notes
                </Button>
              </div>
            </div>
            <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="space-y-3">
                <div className="p-3 bg-black border border-neutral-900 rounded-lg">
                  <p className="text-[10px] uppercase text-neutral-600 mb-1">Why did this fire?</p>
                  <p className="text-neutral-300">{selectedAlert.payload_preview?.match(/^\[([^\]]+)\]/)?.[1] || selectedAlert.type}</p>
                </div>
                <div className="p-3 bg-black border border-neutral-900 rounded-lg">
                  <p className="text-[10px] uppercase text-neutral-600 mb-1 flex items-center gap-2"><Fingerprint size={14} /> Signature</p>
                  <p className="text-xs text-neutral-300">SID/GID: {selectedAlert.signature_sid ?? 'n/a'} / {selectedAlert.signature_gid ?? 'n/a'}</p>
                  <p className="text-xs text-neutral-400">Class: {selectedAlert.signature_class || 'n/a'}</p>
                  <p className="text-xs text-neutral-400 break-all">Msg: {selectedAlert.signature_msg || 'n/a'}</p>
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
                <div className="p-3 bg-black border border-neutral-900 rounded-lg">
                  <p className="text-[10px] uppercase text-neutral-600 mb-1">Raw request</p>
                  <p className="font-mono text-xs text-neutral-300 break-all whitespace-pre-wrap">{selectedAlert.raw_request || 'No raw request captured.'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
