import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ShieldCheck, Mail, Lock, Loader2, ChevronLeft, CheckCircle2, Circle, AlertCircle } from 'lucide-react';
import api from '../lib/api';
import { useAuthStore } from '../lib/store';

const Register = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const navigate = useNavigate();
  const setToken = useAuthStore((state) => state.setToken);

  const rules = [
    { label: "Min 8 characters", test: (pw: string) => pw.length >= 8 },
    { label: "At least one number", test: (pw: string) => /[0-9]/.test(pw) },
    { label: "Special character (!@#$%^&*)", test: (pw: string) => /[!@#$%^&*]/.test(pw) },
    { label: "Passwords match", test: (pw: string) => pw === confirmPassword && pw !== "" }
  ];

  const isFormValid = rules.every(rule => rule.test(password)) && email.includes('@');

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // 1. Create the account
      await api.post('/auth/register', { email, password });

      // 2. Perform Auto-Login (Critical: Must get token before redirecting)
      const loginData = new FormData();
      loginData.append('username', email);
      loginData.append('password', password);

      const loginResponse = await api.post('/auth/token', loginData);
      
      // 3. Save the token to your Zustand store
      setToken(loginResponse.data.access_token);
      
      // 4. GO TO ONBOARDING
      navigate('/onboarding');
      
    } catch (err: any) {
      // Handle "Email already in use" from backend
      setError(err.response?.data?.detail || "Registration failed.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-slate-300 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f2937_1px,transparent_1px),linear-gradient(to_bottom,#1f2937_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-20"></div>
      
      <div className="w-full max-w-[440px] z-10">
        <button onClick={() => navigate('/')} className="group flex items-center gap-2 text-slate-500 hover:text-blue-400 transition-colors mb-8">
          <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span className="text-sm font-medium tracking-widest uppercase text-white">Return to Terminal</span>
        </button>

        <div className="bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-2xl p-8 shadow-2xl">
          <div className="mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-blue-600/10 border border-blue-500/20 mb-4 text-white">
              <ShieldCheck className="text-blue-500 w-6 h-6" />
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Register Operative</h1>
            <p className="text-slate-500 text-sm mt-1">Initialize your security credentials.</p>
          </div>

          <form onSubmit={handleRegister} className="space-y-5">
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs p-3 rounded-lg flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" /> {error}
              </div>
            )}

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1 text-white">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input 
                  type="email" required placeholder="operative@hq.io"
                  className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white focus:border-blue-500/50 outline-none transition-all"
                  value={email} onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1 text-white">Access Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input 
                  type="password" required placeholder="••••••••"
                  className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white focus:border-blue-500/50 outline-none transition-all"
                  value={password} onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2 text-white">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1 text-white">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input 
                  type="password" required placeholder="••••••••"
                  className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white focus:border-blue-500/50 outline-none transition-all"
                  value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
            </div>

            <div className="bg-black/20 rounded-xl p-4 border border-white/5 space-y-2">
              <p className="text-[10px] font-bold text-slate-600 uppercase mb-2 text-white">Security Verification</p>
              {rules.map((rule, index) => (
                <div key={index} className={`flex items-center gap-2 text-xs transition-colors ${rule.test(password) ? 'text-emerald-500' : 'text-slate-600'}`}>
                  {rule.test(password) ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Circle className="w-3.5 h-3.5" />}
                  <span>{rule.label}</span>
                </div>
              ))}
            </div>

            <button 
              disabled={isLoading || !isFormValid}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-30 text-white font-bold py-4 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
            >
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Authorize & Initialize'}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-white/5 text-center">
            <p className="text-sm text-slate-500">
              Already an operative? <Link to="/login" className="text-blue-400 font-bold">Login Here</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;