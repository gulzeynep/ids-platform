// src/pages/dashboard/Management.tsx
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../../stores/auth.store';
import apiClient from '../../api/client';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Key, UserPlus, RefreshCw, Copy, ShieldAlert, Users, X, UserCog, Save, Globe, Server, Power, Info } from 'lucide-react';
import { toast } from 'sonner';

interface UserData {
  id: number;
  email: string;
  full_name: string;
  role: string;
  is_active: boolean;
}

interface ProtectedSite {
  id: number;
  domain: string;
  target_ip: string;
  target_port: number;
  scheme: 'http' | 'https';
  is_active: boolean;
  proxy_url: string;
  dns_target: string;
}

export const Management = () => {
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'admin';
  const queryClient = useQueryClient();

  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);
  const [siteForm, setSiteForm] = useState({ domain: '', target_ip: '', target_port: '80', scheme: 'http' });

  const { data: users, isLoading: usersLoading } = useQuery({
    queryKey: ['workspace_users'],
    queryFn: async () => {
      const res = await apiClient.get('/admin/team');
      return res.data as UserData[];
    },
    enabled: isAdmin
  });

  const toggleAccessMutation = useMutation({
    mutationFn: async (userId: number) => {
      return apiClient.patch(`/admin/team/${userId}/toggle-access`);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['workspace_users'] });
      toast.success(data.data.new_status ? "Account reactivated." : "Account suspended.");
      setSelectedUser(null); 
    }
  });

  const { data: protectedSites, isLoading: sitesLoading } = useQuery({
    queryKey: ['protected_sites'],
    queryFn: async () => {
      const res = await apiClient.get('/admin/protected-sites');
      return res.data as ProtectedSite[];
    },
    enabled: isAdmin
  });

  const createSiteMutation = useMutation({
    mutationFn: async () => apiClient.post('/admin/protected-sites', {
      domain: siteForm.domain,
      target_ip: siteForm.target_ip,
      target_port: Number(siteForm.target_port),
      scheme: siteForm.scheme,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['protected_sites'] });
      toast.success('Protected origin attached to W-IDS proxy.');
      setSiteForm({ domain: '', target_ip: '', target_port: '80', scheme: 'http' });
    },
    onError: () => toast.error('Could not attach this site. Check domain, IP, and port.')
  });

  const toggleSiteMutation = useMutation({
    mutationFn: async (siteId: number) => apiClient.patch(`/admin/protected-sites/${siteId}/toggle`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['protected_sites'] });
      toast.success('Protection status updated.');
    }
  });

  if (!user) {
    return <div className="flex items-center justify-center h-[60vh] animate-pulse font-mono text-blue-500">INITIALIZING_SECURE_VAULT...</div>;
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <header>
        <h2 className="text-2xl font-bold text-white uppercase italic tracking-tight">Workspace Control</h2>
        <p className="text-[10px] text-neutral-500 font-mono tracking-tighter">
          NODE_ID: {String(user?.id || 'UNKNOWN').substring(0, 8)} | AUTH_LVL: {user?.role?.toUpperCase() || 'UNKNOWN'}
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 border-neutral-800 bg-black/40">
          <CardHeader className="border-b border-neutral-900 pb-4">
            <CardTitle className="text-xs font-mono flex items-center gap-2 text-blue-500">
              <Key className="w-4 h-4" /> INSTANCE_ACCESS_TOKEN
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div className="relative">
              <Input value="WIDS_PRO_69f7ff410b76_SECURE_TOKEN" readOnly className="font-mono text-[10px] bg-black border-neutral-800 pr-20 h-10" />
              <Button variant="ghost" className="absolute right-1 top-1 h-8 text-[10px] hover:bg-white/5" onClick={() => { navigator.clipboard.writeText("WIDS_PRO_69f7ff410b76_SECURE_TOKEN"); toast.success("API Key copied."); }}>
                <Copy className="w-3 h-3" />
              </Button>
            </div>
            
            {isAdmin ? (
              <div className="flex items-center justify-between p-4 rounded-2xl bg-red-500/5 border border-red-500/10">
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-red-500 uppercase tracking-widest">Critical Action</p>
                  <p className="text-[10px] text-neutral-500">Rotation forces sensor re-authentication.</p>
                </div>
                <Button variant="danger" size="sm" className="h-8 rounded-lg text-[10px] font-bold">
                  <RefreshCw className="w-3 h-3 mr-2" /> ROTATE
                </Button>
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-neutral-900/30 border border-neutral-800 flex items-center gap-3">
                <ShieldAlert className="w-4 h-4 text-yellow-600" />
                <p className="text-[10px] text-neutral-500 uppercase font-mono">Elevation required.</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-neutral-900 bg-blue-500/[0.02]">
          <CardHeader>
             <CardTitle className="text-[10px] uppercase tracking-widest text-neutral-600 font-bold">Session Identity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col gap-1">
              <span className="text-[10px] text-neutral-700 uppercase font-mono">Active ID</span>
              <span className="text-xs font-bold text-neutral-200">{user?.email}</span>
            </div>
            <div className="flex flex-col gap-1 pt-2 border-t border-white/5">
              <span className="text-[10px] text-neutral-700 uppercase font-mono">Clearance</span>
              <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded w-fit ${isAdmin ? 'bg-blue-500/10 text-blue-500' : 'bg-green-500/10 text-green-500'}`}>
                {user?.role?.toUpperCase()}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {isAdmin && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <Card className="xl:col-span-2 border-neutral-900 bg-[#0a0a0a]">
            <CardHeader className="border-b border-neutral-900 pb-4">
              <CardTitle className="text-xs font-mono flex items-center gap-2 text-neutral-300">
                <Globe className="w-4 h-4 text-blue-500" /> PROTECTED_WEB_TRAFFIC
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <Input placeholder="app.example.com" value={siteForm.domain} onChange={(e) => setSiteForm({ ...siteForm, domain: e.target.value })} className="md:col-span-2 bg-black border-neutral-800" />
                <Input placeholder="10.0.0.15" value={siteForm.target_ip} onChange={(e) => setSiteForm({ ...siteForm, target_ip: e.target.value })} className="bg-black border-neutral-800" />
                <div className="flex gap-2">
                  <Input placeholder="8080" value={siteForm.target_port} onChange={(e) => setSiteForm({ ...siteForm, target_port: e.target.value.replace(/\D/g, '') })} className="bg-black border-neutral-800" />
                  <select value={siteForm.scheme} onChange={(e) => setSiteForm({ ...siteForm, scheme: e.target.value })} className="bg-black border border-neutral-800 rounded-lg px-2 text-xs text-neutral-300 outline-none">
                    <option value="http">HTTP</option>
                    <option value="https">HTTPS</option>
                  </select>
                </div>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs text-neutral-500">Traffic path: user DNS {'->'} W-IDS gateway :8080 {'->'} Snort inspection {'->'} registered origin IP:port.</p>
                <Button size="sm" onClick={() => createSiteMutation.mutate()} isLoading={createSiteMutation.isPending} disabled={!siteForm.domain || !siteForm.target_ip || !siteForm.target_port}>
                  <Server className="w-3 h-3 mr-2" /> Attach Site
                </Button>
              </div>

              <div className="overflow-x-auto border border-neutral-900 rounded-lg">
                <table className="w-full text-left text-sm">
                  <thead className="bg-black/40 text-[10px] uppercase text-neutral-600">
                    <tr>
                      <th className="px-4 py-3">Domain</th>
                      <th className="px-4 py-3">Origin</th>
                      <th className="px-4 py-3">Proxy Entry</th>
                      <th className="px-4 py-3 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-900">
                    {sitesLoading ? (
                      <tr><td colSpan={4} className="p-6 text-center text-neutral-500">Loading protected sites...</td></tr>
                    ) : protectedSites?.length ? protectedSites.map((site) => (
                      <tr key={site.id} className="hover:bg-white/[0.02]">
                        <td className="px-4 py-3">
                          <p className="text-neutral-100 font-medium">{site.domain}</p>
                          <p className="text-[10px] text-neutral-600 font-mono">{site.scheme.toUpperCase()}</p>
                        </td>
                        <td className="px-4 py-3 font-mono text-xs text-neutral-400">{site.target_ip}:{site.target_port}</td>
                        <td className="px-4 py-3 font-mono text-xs text-blue-400">{site.proxy_url}</td>
                        <td className="px-4 py-3 text-right">
                          <Button variant={site.is_active ? 'secondary' : 'ghost'} size="sm" onClick={() => toggleSiteMutation.mutate(site.id)}>
                            <Power className={`w-3 h-3 mr-2 ${site.is_active ? 'text-green-500' : 'text-neutral-600'}`} />
                            {site.is_active ? 'Protected' : 'Paused'}
                          </Button>
                        </td>
                      </tr>
                    )) : (
                      <tr><td colSpan={4} className="p-6 text-center text-neutral-500">No protected origin attached yet.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <Card className="border-blue-500/20 bg-blue-500/[0.03]">
            <CardHeader>
              <CardTitle className="text-xs font-mono flex items-center gap-2 text-blue-400">
                <Info className="w-4 h-4" /> ROUTING_GUIDE
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-xs text-neutral-400">
              <p>1. Add the real app origin, for example <span className="font-mono text-neutral-200">10.0.0.15:3000</span>.</p>
              <p>2. Point the domain or test client to the W-IDS gateway. In this lab use <span className="font-mono text-neutral-200">localhost:8080</span>.</p>
              <p>3. The reverse proxy forwards traffic to the origin while Snort inspects the same packets.</p>
              <div className="rounded-lg border border-neutral-800 bg-black p-3 font-mono text-[10px] text-neutral-300 break-all">
                curl.exe -H "Host: app.example.com" http://127.0.0.1:8080/etc/passwd
              </div>
              <p className="text-neutral-500">Production path: publish this gateway behind a public IP/load balancer, then set the customer domain A/CNAME record to that gateway.</p>
            </CardContent>
          </Card>
        </div>
      )}

      {isAdmin && (
        <Card className="border-neutral-900 bg-[#0a0a0a]">
            {/* ALIGNMENT FIX: w-full eklendi */}
            <CardHeader className="w-full flex flex-row items-center justify-between border-b border-neutral-900 pb-4">
                <CardTitle className="text-xs font-mono flex items-center gap-2 text-neutral-400">
                    <Users className="w-4 h-4" /> PERSONNEL_ROSTER
                </CardTitle>
                <Button onClick={() => setIsAddMemberModalOpen(true)} variant="primary" size="sm" className="bg-blue-600 hover:bg-blue-700 h-8 text-xs rounded-lg m-0">
                    <UserPlus className="w-3 h-3 mr-2" /> Add Team Member
                </Button>
            </CardHeader>
            <CardContent className="p-0">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-neutral-400">
                        <thead className="bg-[#0d0d0d] border-b border-white/5 text-[10px] uppercase font-bold tracking-widest text-neutral-600">
                            <tr>
                                <th className="px-6 py-4">Operative</th>
                                <th className="px-6 py-4">Clearance Role</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {usersLoading ? (
                                <tr><td colSpan={4} className="p-8 text-center text-neutral-500">Scanning directory...</td></tr>
                            ) : users?.map((wsUser) => (
                                <tr key={wsUser.id} className="hover:bg-white/[0.02] transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col">
                                            <span className="text-white font-medium text-sm">{wsUser.full_name || 'System Operator'}</span>
                                            <span className="text-xs font-mono text-neutral-500">{wsUser.email}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${wsUser.role === 'admin' ? 'bg-blue-500/10 text-blue-500' : 'bg-neutral-500/10 text-neutral-400'}`}>
                                            {wsUser.role}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${wsUser.is_active ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                                            {wsUser.is_active ? 'Active' : 'Suspended'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        {String(wsUser.id) !== String(user?.id) && (
                                            <Button 
                                                variant="ghost" 
                                                size="sm"
                                                className="h-8 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                                                onClick={() => setSelectedUser(wsUser)}
                                            >
                                                <UserCog className="w-4 h-4 mr-1" /> Manage
                                            </Button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </CardContent>
        </Card>
      )}

      {/* SEPARATED MODALS */}
      <AddMemberModal 
        isOpen={isAddMemberModalOpen} 
        onClose={() => setIsAddMemberModalOpen(false)} 
        queryClient={queryClient} 
      />
      
      <ManageUserModal 
        user={selectedUser} 
        onClose={() => setSelectedUser(null)} 
        currentUserId={String(user?.id)}
        queryClient={queryClient}
        onToggleAccess={() => selectedUser && toggleAccessMutation.mutate(selectedUser.id)}
        isToggling={toggleAccessMutation.isPending}
      />
    </div>
  );
};


// ==========================================
// MODAL COMPONENTS (Extracted for Clean Code)
// ==========================================

const AddMemberModal = ({ isOpen, onClose, queryClient }: any) => {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('analyst');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const addMemberMutation = useMutation({
    mutationFn: async () => {
      // Backend UserRegister schema needs to support 'role' field
      return apiClient.post('/admin/team/add', { email, password, role });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace_users'] });
      toast.success("New operative deployed successfully.");
      onClose();
      setEmail(''); setPassword(''); setConfirmPassword('');
    },
    onError: () => toast.error("Failed to add operative. Email might already exist.")
  });

  const handleDeploy = () => {
    if (password !== confirmPassword) return toast.error("Passwords do not match.");
    if (password.length < 6) return toast.error("Password must be at least 6 characters.");
    addMemberMutation.mutate();
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
        <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-5 border-b border-white/5 bg-[#0d0d0d]">
                <h3 className="text-sm font-bold text-white uppercase tracking-tight flex items-center gap-2">
                    <UserPlus className="w-4 h-4 text-blue-500" /> Deploy New Operative
                </h3>
                <button onClick={onClose} className="text-neutral-400 hover:text-white transition-colors"><X size={20} /></button>
            </div>

            <div className="p-6 space-y-4">
                <div>
                    <label className="text-[10px] text-neutral-500 uppercase font-bold mb-2 block">Operative Email</label>
                    <Input type="email" placeholder="analyst@wids-core.io" className="bg-black border-white/10 text-white text-sm" value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                <div>
                    <label className="text-[10px] text-neutral-500 uppercase font-bold mb-2 block">Access Level (Role)</label>
                    <select className="w-full bg-black border border-white/10 rounded-lg p-3 text-sm font-mono text-white focus:outline-none" value={role} onChange={(e) => setRole(e.target.value)}>
                        <option value="admin">Administrator</option>
                        <option value="analyst">Analyst</option>
                        <option value="viewer">Viewer</option>
                    </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="text-[10px] text-neutral-500 uppercase font-bold mb-2 block">Password</label>
                        <Input type="password" placeholder="Min 6 chars" className="bg-black border-white/10 text-white text-sm" value={password} onChange={(e) => setPassword(e.target.value)} />
                    </div>
                    <div>
                        <label className="text-[10px] text-neutral-500 uppercase font-bold mb-2 block">Confirm</label>
                        <Input type="password" placeholder="Repeat password" className="bg-black border-white/10 text-white text-sm" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
                    </div>
                </div>
                
                <div className="pt-4 flex gap-3">
                    <Button variant="ghost" className="w-full" onClick={onClose}>Cancel</Button>
                    <Button variant="primary" className="w-full bg-blue-600 hover:bg-blue-700" onClick={handleDeploy} isLoading={addMemberMutation.isPending} disabled={!email || !password}>
                      Deploy
                    </Button>
                </div>
            </div>
        </div>
    </div>
  );
}


const ManageUserModal = ({ user, onClose, currentUserId, queryClient, onToggleAccess, isToggling }: any) => {
  // SAVING LOGIC: We hold the selected role in local state. Only save when button is clicked.
  const [pendingRole, setPendingRole] = useState(user?.role || 'viewer');

  const updateRoleMutation = useMutation({
    mutationFn: async (newRole: string) => {
      return apiClient.patch(`/admin/team/${user.id}/grant-access?new_role=${newRole}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace_users'] });
      toast.success("User clearance updated successfully.");
      onClose();
    },
    onError: () => toast.error("Failed to update clearance level.")
  });

  if (!user) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
        <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-5 border-b border-white/5 bg-[#0d0d0d]">
                <h3 className="text-sm font-bold text-white uppercase tracking-tight flex items-center gap-2">
                    <UserCog className="w-4 h-4 text-blue-500" /> Modify Clearance
                </h3>
                <button onClick={onClose} className="text-neutral-400 hover:text-white transition-colors"><X size={20} /></button>
            </div>

            <div className="p-6 space-y-6">
                <div>
                    <p className="text-[10px] text-neutral-500 uppercase font-bold mb-1">Target Operative</p>
                    <p className="text-white font-medium">{user.full_name || 'System Operator'}</p>
                    <p className="text-xs font-mono text-neutral-500">{user.email}</p>
                </div>

                <div>
                    <p className="text-[10px] text-neutral-500 uppercase font-bold mb-2">Access Level (Role)</p>
                    <select 
                        className="w-full bg-black border border-white/10 rounded-lg p-3 text-sm font-mono text-white focus:border-blue-500 focus:outline-none"
                        defaultValue={user.role}
                        onChange={(e) => setPendingRole(e.target.value)}
                        disabled={String(user.id) === currentUserId}
                    >
                        <option value="admin">Administrator (Full Access)</option>
                        <option value="analyst">Analyst (View & Resolve Alerts)</option>
                        <option value="viewer">Viewer (Read Only)</option>
                    </select>
                    {String(user.id) === currentUserId && (
                        <p className="text-[10px] text-yellow-500 mt-2">You cannot modify your own clearance level.</p>
                    )}
                </div>

                {/* SAVE BUTTON FOR ROLE */}
                <Button 
                    variant="primary" 
                    className="w-full bg-blue-600 hover:bg-blue-700"
                    disabled={String(user.id) === currentUserId || pendingRole === user.role}
                    onClick={() => updateRoleMutation.mutate(pendingRole)}
                    isLoading={updateRoleMutation.isPending}
                >
                    <Save className="w-4 h-4 mr-2" /> Save Role Changes
                </Button>

                <div className="pt-4 border-t border-white/5 flex justify-between items-center">
                    <div>
                        <p className="text-[10px] text-red-500 font-bold uppercase">Danger Zone</p>
                        <p className="text-xs text-neutral-500">{user.is_active ? 'Revoke access immediately.' : 'Restore operative access.'}</p>
                    </div>
                    <Button 
                        variant="danger" 
                        size="sm" 
                        className={`text-xs ${!user.is_active ? 'bg-green-600 hover:bg-green-700 text-white border-green-600' : ''}`}
                        disabled={String(user.id) === currentUserId}
                        onClick={onToggleAccess}
                        isLoading={isToggling}
                    >
                        {user.is_active ? 'Suspend Account' : 'Reactivate'}
                    </Button>
                </div>
            </div>
        </div>
    </div>
  );
}
