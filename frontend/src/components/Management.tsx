import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ShieldCheck, ShieldAlert, Clock, Search, Filter, Loader2, CheckCircle2, XCircle } from 'lucide-react';
import api from '../lib/api';

const Management = () => {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('new');
  const [severityFilter, setSeverityFilter] = useState('all');

  // 1. FETCH ALERTS WITH FILTERS
  const { data: alerts, isLoading } = useQuery({
    queryKey: ['management-alerts', statusFilter, severityFilter],
    queryFn: async () => {
      const response = await api.get('/alerts/', {
        params: { status_filter: statusFilter, severity: severityFilter }
      });
      return response.data;
    }
  });

  // 2. MUTATION FOR UPDATING STATUS (TRIAGE)
  const triageMutation = useMutation({
    mutationFn: async ({ alertId, newStatus }: { alertId: number, newStatus: string }) => {
      return await api.patch(`/alerts/${alertId}/triage`, { status: newStatus });
    },
    onSuccess: () => {
      // Refresh the list immediately after a change
      queryClient.invalidateQueries({ queryKey: ['management-alerts'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    }
  });

  const handleStatusChange = (alertId: number, newStatus: string) => {
    triageMutation.mutate({ alertId, newStatus });
  };

  if (isLoading) {
    return <div className="flex justify-center p-20"><Loader2 className="animate-spin text-blue-500 w-10 h-10" /></div>;
  }

  return (
    <div className="space-y-6">
      {/* FILTERS HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 p-4 border border-slate-800 rounded-xl">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-800 border border-slate-700 text-white text-sm rounded-lg pl-10 pr-4 py-2 focus:ring-blue-500 outline-none"
            >
              <option value="new">New Alerts</option>
              <option value="reviewed">Reviewed</option>
            </select>
          </div>
          
          <select 
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-white text-sm rounded-lg px-4 py-2 focus:ring-blue-500 outline-none"
          >
            <option value="all">All Severities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
        
        <div className="text-slate-400 text-sm">
          Displaying <span className="text-white font-bold">{alerts?.length || 0}</span> security events
        </div>
      </div>

      {/* ALERTS TABLE / LIST */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-950 border-b border-slate-800">
              <th className="p-4 text-xs font-semibold text-slate-400 uppercase">Timestamp</th>
              <th className="p-4 text-xs font-semibold text-slate-400 uppercase">Type / Source</th>
              <th className="p-4 text-xs font-semibold text-slate-400 uppercase">Severity</th>
              <th className="p-4 text-xs font-semibold text-slate-400 uppercase">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {alerts?.map((alert: any) => (
              <tr key={alert.id} className="hover:bg-slate-800/50 transition-colors">
                <td className="p-4 text-sm text-slate-400 whitespace-nowrap">
                  {new Date(alert.timestamp).toLocaleString()}
                </td>
                <td className="p-4">
                  <div className="text-white font-medium">{alert.type}</div>
                  <div className="text-xs text-slate-500 font-mono">{alert.source_ip}</div>
                </td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
                    alert.severity === 'critical' ? 'bg-red-500/10 text-red-500' :
                    alert.severity === 'high' ? 'bg-orange-500/10 text-orange-500' :
                    'bg-blue-500/10 text-blue-500'
                  }`}>
                    {alert.severity}
                  </span>
                </td>
                <td className="p-4">
                  <div className="flex gap-2">
                    {alert.status === 'new' ? (
                      <button 
                        onClick={() => handleStatusChange(alert.id, 'reviewed')}
                        className="flex items-center gap-1 bg-emerald-600/10 hover:bg-emerald-600 text-emerald-500 hover:text-white px-3 py-1 rounded-md text-xs transition-all border border-emerald-600/20"
                      >
                        <CheckCircle2 className="w-3 h-3" /> Mark Resolved
                      </button>
                    ) : (
                      <button 
                        onClick={() => handleStatusChange(alert.id, 'new')}
                        className="flex items-center gap-1 bg-slate-700/50 hover:bg-slate-700 text-slate-300 px-3 py-1 rounded-md text-xs transition-all"
                      >
                        <XCircle className="w-3 h-3" /> Re-open
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {alerts?.length === 0 && (
          <div className="p-12 text-center text-slate-500">
            <ShieldCheck className="mx-auto w-12 h-12 mb-4 opacity-20" />
            <p>No alerts found matching your filters.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Management;