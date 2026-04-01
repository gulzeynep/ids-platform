import { ShieldCheck, Trash2 } from 'lucide-react';

export default function AdminPanel({ users, onBack }: any) {
  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-10">
        <h2 className="text-3xl font-black tracking-tighter flex items-center gap-3">
          <ShieldCheck className="text-red-500" /> SYSTEM AUTHORITY
        </h2>
        <button onClick={onBack} className="text-xs font-bold text-slate-500 hover:text-white uppercase tracking-widest">Exit Terminal</button>
      </div>

      <div className="grid md:grid-cols-3 gap-6 mb-12">
        <div className="bg-[#0a0a0a] border border-white/5 p-6 rounded-3xl">
          <p className="text-[10px] text-slate-500 uppercase font-black mb-1 text-center">Active Operators</p>
          <p className="text-4xl font-mono text-center">{users.length}</p>
        </div>
        {/* Diğer global istatistik kartları... */}
      </div>

      <div className="bg-[#0a0a0a] border border-white/5 rounded-[32px] overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-white/5 text-[10px] uppercase font-black text-slate-500">
            <tr>
              <th className="px-6 py-4 italic">Operator</th>
              <th className="px-6 py-4 italic">Organization</th>
              <th className="px-6 py-4 italic">Role</th>
              <th className="px-6 py-4 text-right italic">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {users.map((u: any) => (
              <tr key={u.id} className="hover:bg-white/[0.02]">
                <td className="px-6 py-4 font-bold">{u.username}</td>
                <td className="px-6 py-4 text-slate-400">{u.company_name}</td>
                <td className="px-6 py-4">
                   <span className={`px-2 py-1 rounded text-[10px] font-bold ${u.is_admin ? 'text-red-500 bg-red-500/10' : 'text-blue-500 bg-blue-500/10'}`}>
                     {u.is_admin ? 'ADMIN' : 'OPERATOR'}
                   </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <button className="text-red-500/50 hover:text-red-500 transition-colors"><Trash2 size={16} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}