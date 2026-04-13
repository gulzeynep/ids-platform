import { useQuery } from '@tanstack/react-query';
import { User, Building2, ShieldCheck, Mail, Calendar, Loader2 } from 'lucide-react';
import api from '../lib/api';

const Profile = () => {
  const { data: profile, isLoading } = useQuery({
    queryKey: ['user-profile'],
    queryFn: async () => {
      const response = await api.get('/auth/me');
      return response.data;
    }
  });

  if (isLoading) return <div className="flex justify-center p-20"><Loader2 className="animate-spin text-blue-500 w-10 h-10" /></div>;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="h-32 bg-gradient-to-r from-blue-600 to-indigo-600"></div>
        <div className="px-8 pb-8">
          <div className="relative -mt-12 mb-6">
            <div className="w-24 h-24 bg-slate-800 border-4 border-slate-900 rounded-2xl flex items-center justify-center shadow-lg">
              <User className="w-12 h-12 text-blue-500" />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-white">{profile?.full_name || 'Operative'}</h2>
                <p className="text-slate-400 text-sm">Designation: <span className="text-blue-400 font-mono uppercase">{profile?.user_persona}</span></p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-3 text-slate-300">
                  <Mail className="w-5 h-5 text-slate-500" />
                  <span>{profile?.email}</span>
                </div>
                <div className="flex items-center gap-3 text-slate-300">
                  <ShieldCheck className="w-5 h-5 text-slate-500" />
                  <span className="capitalize">Role: {profile?.role}</span>
                </div>
                <div className="flex items-center gap-3 text-slate-300">
                  <Calendar className="w-5 h-5 text-slate-500" />
                  <span>Joined: {new Date(profile?.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            </div>

            <div className="bg-slate-950/50 border border-slate-800 p-6 rounded-xl space-y-4">
              <div className="flex items-center gap-2 text-white font-semibold">
                <Building2 className="w-5 h-5 text-blue-500" />
                <span>Assigned Workspace</span>
              </div>
              <div className="p-4 bg-slate-900 rounded-lg border border-slate-800">
                <div className="text-xs text-slate-500 uppercase font-bold mb-1">Entity Name</div>
                <div className="text-white font-mono">{profile?.workspace_name}</div>
              </div>
              <div className="p-4 bg-slate-900 rounded-lg border border-slate-800">
                <div className="text-xs text-slate-500 uppercase font-bold mb-1">Status</div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                  <span className="text-emerald-500 text-sm font-medium">Active & Synchronized</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;