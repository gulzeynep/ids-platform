import { useState } from 'react';
import { Shield, Lock, User, AlertCircle, Home } from 'lucide-react';
import api from '../lib/api';

interface LoginProps { onLoginSuccess: () => void; onRegisterClick: () => void; onBack: () => void; }

export default function Login({ onLoginSuccess, onRegisterClick, onBack }: LoginProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append('username', username);
      formData.append('password', password);
      const res = await api.post('/auth/token', formData);
      localStorage.setItem('token', res.data.access_token);
      onLoginSuccess();
    } catch (err) { setError('ACCESS DENIED: Unauthorized Identity'); }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-slate-200">
      <nav className="border-b border-white/5 p-4 flex justify-between items-center bg-black/50 backdrop-blur-md">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 font-bold cursor-pointer" onClick={onBack}><Shield className="text-blue-500 w-5 h-5" /><span>W-IDS</span></div>
        </div>
        <div className="flex gap-4 items-center">
          <button onClick={onBack} className="text-[10px] font-black text-slate-400 hover:text-white uppercase tracking-widest">Home</button>
          <button onClick={() => window.dispatchEvent(new CustomEvent('setView', {detail: 'contact'}))} className="text-[10px] font-black text-slate-400 hover:text-white uppercase tracking-widest">Contact</button>
          <button onClick={onRegisterClick} className="bg-white text-black px-4 py-1.5 rounded-full text-[10px] font-black uppercase hover:bg-blue-500 hover:text-white transition-all">Sign Up</button>
        </div>
      </nav>

      <div className="flex items-center justify-center p-6 mt-20">
        <div className="w-full max-w-md bg-[#0a0a0a] border border-white/5 p-8 rounded-[32px] shadow-2xl">
          <div className="flex flex-col items-center mb-8">
            <div className="p-4 bg-blue-600/10 rounded-2xl mb-4"><Lock className="w-8 h-8 text-blue-500" /></div>
            <h2 className="text-xl font-bold tracking-tight uppercase italic">Authorization Required</h2>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-500 uppercase ml-1 tracking-widest">Email Address</label>              <div className="relative"><User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
            <input 
            type="text" 
            placeholder="name@company.com"
            className="w-full bg-black border border-white/5 rounded-xl py-4 pl-12 text-white outline-none" 
            value={username} 
            onChange={e => setUsername(e.target.value)} 
            />              
            </div>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-500 uppercase ml-1 tracking-widest">Access Key</label>
              <div className="relative"><Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                <input type="password" className="w-full bg-black border border-white/5 rounded-xl py-4 pl-12 text-white outline-none focus:border-blue-500/50" value={password} onChange={e => setPassword(e.target.value)} />
              </div>
            </div>
            {error && <div className="text-red-500 text-[10px] font-bold text-center uppercase tracking-widest">{error}</div>}
            <button type="submit" className="w-full bg-blue-600 py-4 rounded-xl font-bold hover:bg-blue-500 transition-all uppercase tracking-widest">Authorize Access</button>
          </form>
        </div>
      </div>
    </div>
  );
}