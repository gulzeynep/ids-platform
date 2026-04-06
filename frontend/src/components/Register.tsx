import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Mail, Lock, User, Building, Loader2, ArrowRight } from 'lucide-react';
import api from '../lib/api';

export default function Register() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    company_name: '',
    full_name: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await api.post('/auth/register', formData);
      // Registration successful, auto-redirect to login
      navigate('/login');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Registration failed. Check inputs.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-slate-200 flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-500/5 blur-[150px] rounded-full pointer-events-none" />
      
      <div className="w-full max-w-md relative z-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/5 border border-white/10 mb-6 cursor-pointer" onClick={() => navigate('/')}>
            <Shield className="text-blue-500 w-8 h-8" />
          </div>
          {/* BACK TO HOME BUTTON */}
          <button 
            onClick={() => navigate('/')} 
            className="absolute top-0 left-0 flex items-center gap-2 text-slate-500 hover:text-white transition-colors text-xs font-bold uppercase tracking-widest group"
          >
            <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-white/10 border border-white/10">
              <ArrowRight className="rotate-180 w-4 h-4" />
            </div>
            Back to Home
          </button>
          <h2 className="text-3xl font-black text-white italic tracking-tight">INITIALIZE PROFILE</h2>
          <p className="text-slate-500 text-xs uppercase tracking-widest mt-2">Register new SOC Analyst credentials</p>
        </div>

        <form onSubmit={handleRegister} className="bg-[#0a0a0a] border border-white/5 rounded-[32px] p-8 shadow-2xl">
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-xs font-bold uppercase tracking-wider text-center">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Username</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                  <input type="text" name="username" required onChange={handleChange} className="w-full bg-[#050505] border border-white/10 rounded-xl py-2.5 pl-10 pr-3 text-white text-sm focus:border-blue-500/50" placeholder="johndoe" />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                  <input type="text" name="full_name" onChange={handleChange} className="w-full bg-[#050505] border border-white/10 rounded-xl py-2.5 pl-10 pr-3 text-white text-sm focus:border-blue-500/50" placeholder="John Doe" />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                <input type="email" name="email" required onChange={handleChange} className="w-full bg-[#050505] border border-white/10 rounded-xl py-2.5 pl-10 pr-3 text-white text-sm focus:border-blue-500/50" placeholder="analyst@domain.com" />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Company / Organization</label>
              <div className="relative">
                <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                <input type="text" name="company_name" required onChange={handleChange} className="w-full bg-[#050505] border border-white/10 rounded-xl py-2.5 pl-10 pr-3 text-white text-sm focus:border-blue-500/50" placeholder="CyberSec Inc." />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                <input type="password" name="password" required onChange={handleChange} className="w-full bg-[#050505] border border-white/10 rounded-xl py-2.5 pl-10 pr-3 text-white text-sm focus:border-blue-500/50" placeholder="••••••••" />
              </div>
            </div>

            <button type="submit" disabled={loading} className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-black text-sm uppercase tracking-wider py-4 rounded-xl transition-all mt-6 disabled:opacity-50">
              {loading ? <Loader2 className="animate-spin" size={18} /> : <>Create Clearance <ArrowRight size={18} /></>}
            </button>
          </div>
        </form>

        <p className="text-center mt-8 text-xs text-slate-500">
          Already verified? <button onClick={() => navigate('/login')} className="text-blue-400 font-bold hover:text-blue-300">Sign In here</button>
        </p>
      </div>
    </div>
  );
}