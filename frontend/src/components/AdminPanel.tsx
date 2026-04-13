import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Users, ShieldAlert, UserMinus, UserPlus, Key, Loader2 } from 'lucide-react';
import api from '../lib/api';

const AdminPanel = () => {
  const queryClient = useQueryClient();

  const { data: team, isLoading } = useQuery({
    queryKey: ['workspace-team'],
    queryFn: async () => (await api.get('/admin/team')).data
  });

  const toggleStatusMutation = useMutation({
    mutationFn: async (userId: number) => {
      return await api.patch(`/admin/team/${userId}/toggle-status`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace-team'] });
    }
  });

  if (isLoading) return <Loader2 className="animate-spin text-blue-500 mx-auto mt-20" />;

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <Users className="text-blue-500 w-8 h-8" />
        <h1 className="text-2xl font-bold text-white">Workspace Team Management</h1>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-950 border-b border-slate-800">
            <tr>
              <th className="p-4 text-xs font-bold text-slate-500 uppercase">Operative</th>
              <th className="p-4 text-xs font-bold text-slate-500 uppercase">Role</th>
              <th className="p-4 text-xs font-bold text-slate-500 uppercase">Status</th>
              <th className="p-4 text-xs font-bold text-slate-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {team?.map((member: any) => (
              <tr key={member.id} className="hover:bg-slate-800/30 transition-colors">
                <td className="p-4">
                  <div className="text-white font-medium">{member.full_name || 'Pending Name'}</div>
                  <div className="text-xs text-slate-500">{member.email}</div>
                </td>
                <td className="p-4">
                  <span className="text-xs text-blue-400 bg-blue-400/10 px-2 py-1 rounded uppercase font-bold">
                    {member.role}
                  </span>
                </td>
                <td className="p-4">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${member.is_active ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
                    <span className={`text-sm ${member.is_active ? 'text-emerald-500' : 'text-red-500'}`}>
                      {member.is_active ? 'Active' : 'Suspended'}
                    </span>
                  </div>
                </td>
                <td className="p-4">
                  <div className="flex gap-2">
                    <button 
                      onClick={() => toggleStatusMutation.mutate(member.id)}
                      className={`p-2 rounded-lg border transition-all ${
                        member.is_active 
                        ? 'border-red-500/20 text-red-500 hover:bg-red-500 hover:text-white' 
                        : 'border-emerald-500/20 text-emerald-500 hover:bg-emerald-500 hover:text-white'
                      }`}
                      title={member.is_active ? 'Suspend Operative' : 'Activate Operative'}
                    >
                      {member.is_active ? <UserMinus className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                    </button>
                    <button className="p-2 rounded-lg border border-slate-700 text-slate-400 hover:bg-slate-700 hover:text-white transition-all">
                      <Key className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminPanel;