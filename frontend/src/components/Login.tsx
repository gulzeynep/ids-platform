import { useState } from 'react';
import { Shield, Lock, User, AlertCircle } from 'lucide-react';
import api from '../lib/api';

interface LoginProps { onLoginSuccess: () => void; onRegisterClick: () => void; onBack: () => void; }

export default function Login({ onLoginSuccess, onRegisterClick, onBack }: LoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const params = new URLSearchParams();
      params.append('username', email); 
      params.append('password', password);
      
      const res = await api.post('/auth/token', params, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      });
      
      localStorage.setItem('token', res.data.access_token);
      onLoginSuccess();
    } catch (err) { 
      setError('ACCESS DENIED: Invalid Credentials'); 
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-slate-200 selection:bg-blue-500/30">
      <nav className="border-b border-white/5 p-4 flex justify-between items-center bg-black/50 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-2 font-bold cursor-pointer" onClick={onBack}>
          <Shield className="text-blue-500 w-5 h-5" /> <span>W-IDS</span>
        </div>
        <div className="flex gap-4 items-center font-black text-[10px] tracking-widest">
          <button onClick={onBack} className="text-slate-400 hover:text-white uppercase">Home</button>
          <button onClick={() => window.dispatchEvent(new CustomEvent('setView', {detail: 'contact'}))} className="text-slate-400 hover:text-white uppercase border-l border-white/10 pl-4">Contact</button>
          <button onClick={onRegisterClick} className="bg-white text-black px-4 py-1.5 rounded-full hover:bg-blue-500 hover:text-white transition-all uppercase">Sign Up</button>
        </div>
      </nav>

      <div className="flex items-center justify-center p-6 mt-20">
        <div className="w-full max-w-md bg-[#0a0a0a] border border-white/5 p-8 rounded-[32px] shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex flex-col items-center mb-8">
            <div className="p-4 bg-blue-600/10 rounded-2xl mb-4"><Lock className="w-8 h-8 text-blue-500" /></div>
            <h2 className="text-xl font-bold tracking-tight uppercase italic text-white">Operator Login</h2>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-500 uppercase ml-1 tracking-widest">Email Address</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                <input 
                  type="email" 
                  required
                  placeholder="operator@company.com"
                  className="w-full bg-black border border-white/5 rounded-xl py-4 pl-12 text-white outline-none focus:border-blue-500/50 transition-all" 
                  value={email} 
                  onChange={e => setEmail(e.target.value)} 
                />
              </div>
            </div>
            
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-500 uppercase ml-1 tracking-widest">Access Key</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                <input 
                  type="password" 
                  required
                  placeholder="••••••••"
                  className="w-full bg-black border border-white/5 rounded-xl py-4 pl-12 text-white outline-none focus:border-blue-500/50 transition-all" 
                  value={password} 
                  onChange={e => setPassword(e.target.value)} 
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 p-3 rounded-xl flex items-center gap-3 text-red-500 text-[10px] font-bold animate-shake">
                <AlertCircle size={14} /> {error}
              </div>
            )}
            
            <button type="submit" className="w-full bg-blue-600 py-4 rounded-xl font-black hover:bg-blue-500 transition-all uppercase tracking-widest shadow-lg shadow-blue-600/20">Authorize Access</button>
          </form>

          <div className="mt-8 pt-6 border-t border-white/5 text-center">
            <p className="text-xs text-slate-500">
              Need a new identity? <button onClick={onRegisterClick} className="text-blue-500 font-bold hover:underline">Register Unit</button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}