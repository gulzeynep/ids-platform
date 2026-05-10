import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '../../components/ui/Card';
import { Globe, Plus, Trash2, Server, Globe2 } from 'lucide-react';
import { 
  getMonitoredWebsites, 
  addMonitoredWebsite, 
  deleteMonitoredWebsite, 
  type MonitoredWebsite, 
  type WebsiteCreateRequest 
} from '../../api/endpoints/websites';

export const WebsitePanel = () => {
  const [websites, setWebsites] = useState<MonitoredWebsite[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  
  const [newDomain, setNewDomain] = useState('');
  const [newIp, setNewIp] = useState('');
  const [newPort, setNewPort] = useState('80');

  const fetchWebsites = async () => {
    try {
      setLoading(true);
      const data = await getMonitoredWebsites();
      setWebsites(data);
    } catch (err) {
      console.error("Failed to load websites", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWebsites();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDomain || !newIp) return;
    
    try {
      setAdding(true);
      const payload: WebsiteCreateRequest = {
        domain: newDomain,
        target_ip: newIp,
        target_port: parseInt(newPort, 10) || 80
      };
      
      const added = await addMonitoredWebsite(payload);
      setWebsites([added, ...websites]);
      setNewDomain('');
      setNewIp('');
      setNewPort('80');
    } catch (err: any) {
      alert(err?.response?.data?.detail || "Failed to add website");
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Are you sure you want to stop monitoring this website?")) return;
    
    try {
      await deleteMonitoredWebsite(id);
      setWebsites(websites.filter(w => w.id !== id));
    } catch (err) {
      console.error("Failed to delete", err);
      alert("Failed to delete website");
    }
  };

  return (
    <Card className="bg-white/[0.02] border-white/5 rounded-[2rem] overflow-hidden mt-8">
      <CardContent className="p-8 space-y-6">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-bold text-blue-500 uppercase tracking-[0.2em] flex items-center gap-2">
            <Globe size={18} /> Monitored Websites
          </h4>
          <span className="px-3 py-1 bg-blue-500/10 text-blue-400 rounded-full text-[10px] font-bold uppercase tracking-widest border border-blue-500/20">
            {websites.length} Active
          </span>
        </div>
        
        <p className="text-xs text-neutral-500 font-medium leading-relaxed">
          Add target websites to route traffic through the W-IDS Reverse Proxy. Ensure your domain's DNS A-Record points to this IDS server's IP.
        </p>

        {/* Add Form */}
        <form onSubmit={handleAdd} className="flex flex-col md:flex-row gap-4 p-4 bg-black/40 rounded-2xl border border-white/5">
          <div className="flex-1">
            <label className="text-[10px] uppercase text-neutral-500 font-bold tracking-widest mb-1 block">Domain Name</label>
            <div className="relative">
              <Globe2 size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
              <input 
                type="text" 
                placeholder="e.g. example.com" 
                className="w-full bg-white/5 border border-white/10 rounded-xl py-2 pl-9 pr-3 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-blue-500/50"
                value={newDomain}
                onChange={e => setNewDomain(e.target.value)}
                required
              />
            </div>
          </div>
          
          <div className="flex-1">
            <label className="text-[10px] uppercase text-neutral-500 font-bold tracking-widest mb-1 block">Target Server IP</label>
            <div className="relative">
              <Server size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
              <input 
                type="text" 
                placeholder="e.g. 192.168.1.50" 
                className="w-full bg-white/5 border border-white/10 rounded-xl py-2 pl-9 pr-3 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-blue-500/50"
                value={newIp}
                onChange={e => setNewIp(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="w-24">
            <label className="text-[10px] uppercase text-neutral-500 font-bold tracking-widest mb-1 block">Port</label>
            <input 
              type="number" 
              placeholder="80" 
              className="w-full bg-white/5 border border-white/10 rounded-xl py-2 px-3 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-blue-500/50"
              value={newPort}
              onChange={e => setNewPort(e.target.value)}
              required
            />
          </div>
          
          <div className="flex items-end">
            <button 
              type="submit" 
              disabled={adding || !newDomain || !newIp}
              className="h-[38px] px-6 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-bold uppercase tracking-widest rounded-xl transition-colors flex items-center gap-2"
            >
              {adding ? 'Adding...' : <><Plus size={14} /> Add</>}
            </button>
          </div>
        </form>

        {/* Website List */}
        <div className="space-y-3 mt-6">
          {loading ? (
            <div className="text-center py-8 text-neutral-500 text-sm font-mono animate-pulse">Loading targets...</div>
          ) : websites.length === 0 ? (
            <div className="text-center py-8 bg-white/[0.01] rounded-2xl border border-white/5 text-neutral-500 text-sm">
              No websites are currently being monitored.
            </div>
          ) : (
            websites.map(site => (
              <div key={site.id} className="flex items-center justify-between p-4 bg-white/[0.02] hover:bg-white/[0.04] border border-white/5 rounded-2xl transition-colors group">
                <div className="flex items-center gap-4">
                  <div className={`w-2 h-2 rounded-full ${site.is_active ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]' : 'bg-neutral-600'}`} />
                  <div>
                    <div className="text-sm font-bold text-white">{site.domain}</div>
                    <div className="text-xs text-neutral-500 font-mono mt-0.5">
                      Target: {site.target_ip}:{site.target_port}
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => handleDelete(site.id)}
                  className="p-2 text-neutral-500 hover:text-red-400 hover:bg-red-400/10 rounded-xl transition-colors opacity-0 group-hover:opacity-100"
                  title="Stop monitoring"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};
