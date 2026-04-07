import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, ArrowRight, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import api from '../lib/api';

export default function Register() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: '', password: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // PASSWORD SECURITY CHECK
  const passChecks = {
    length: formData.password.length >= 8,
    upper: /[A-Z]/.test(formData.password),
    number: /[0-9]/.test(formData.password),
    special: /[!@#$%^&*.,_/?\-]/ .test(formData.password)
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // MATCH CHECK
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    // SECURITY CHECK
    if (!Object.values(passChecks).every(Boolean)) {
      setError("Password does not meet security requirements.");
      return;
    }

    setLoading(true);
    try {      
      await api.post('/auth/register', {
        email: formData.email,
        password: formData.password
      });
      
      const loginParams = new URLSearchParams();
      loginParams.append('username', formData.email); 
      loginParams.append('password', formData.password);
      
      const loginRes = await api.post('/auth/token', loginParams, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      });
      
      localStorage.setItem('token', loginRes.data.access_token);
      
      navigate('/onboarding');

    } catch (err: any) {
      const errorDetail = err.response?.data?.detail;
      
      if (Array.isArray(errorDetail)) {
        setError(`Invalid format: ${errorDetail[0]?.loc?.slice(-1)} is required.`);
      } else if (typeof errorDetail === 'string') {
        setError(errorDetail);
      } else {
        setError("System registration failed. Check connection.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-slate-200 flex items-center justify-center p-6 relative">
      <button onClick={() => navigate('/')} className="absolute top-10 left-10 flex items-center gap-2 text-slate-500 hover:text-white transition-all uppercase text-[10px] font-black tracking-widest">
        <ArrowRight className="rotate-180" size={16} /> Back to HQ
      </button>

      <div className="w-full max-w-md animate-in fade-in slide-in-from-bottom-4">
        <div className="text-center mb-10">
          <Shield className="text-blue-500 w-12 h-12 mx-auto mb-4" />
          <h2 className="text-3xl font-black italic tracking-tighter">CREATE CLEARANCE</h2>
        </div>

        <form onSubmit={handleRegister} className="bg-[#0a0a0a] border border-white/5 rounded-[40px] p-8 space-y-4 shadow-2xl">
          {error && <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] font-black uppercase rounded-2xl text-center">{error}</div>}
          
          <input type="email" placeholder="EMAIL ADDRESS" required className="w-full bg-black border border-white/10 rounded-2xl p-4 text-sm outline-none focus:border-blue-500/50 transition-colors" onChange={e => setFormData({...formData, email: e.target.value})} />
          
          <div className="relative">
            <input type="password" placeholder="SECURE PASSWORD" required className="w-full bg-black border border-white/10 rounded-2xl p-4 text-sm outline-none focus:border-blue-500/50 transition-colors" onChange={e => setFormData({...formData, password: e.target.value})} />
            
            <div className="mt-4 grid grid-cols-2 gap-3 p-4 bg-white/[0.02] rounded-2xl border border-white/5">
              <PasswordRule met={passChecks.length} text="8+ Characters" />
              <PasswordRule met={passChecks.upper} text="1 Uppercase" />
              <PasswordRule met={passChecks.number} text="1 Number" />
              <PasswordRule met={passChecks.special} text="1 Special Symbol" />
            </div>
          </div>

          <input type="password" placeholder="CONFIRM PASSWORD" required className="w-full bg-black border border-white/10 rounded-2xl p-4 text-sm outline-none focus:border-blue-500/50 transition-colors" onChange={e => setFormData({...formData, confirmPassword: e.target.value})} />

          <button disabled={loading} className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-2xl uppercase text-[10px] tracking-widest transition-all mt-6 shadow-lg shadow-blue-500/20 disabled:opacity-50">
            {loading ? <Loader2 className="animate-spin mx-auto" size={18} /> : "Initialize Identity"}
          </button>

          {/* LOGIN REDIRECT LINK */}
          <div className="mt-6 pt-4 border-t border-white/5 text-center">
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
              Already have an account?{' '}
              <span onClick={() => navigate('/login')} className="text-blue-500 hover:text-white cursor-pointer transition-colors ml-1">
                Access HQ
              </span>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}

function PasswordRule({ met, text }: { met: boolean; text: string }) {
  return (
    <div className={`flex items-center gap-2 text-[9px] font-black uppercase tracking-widest transition-colors ${met ? 'text-green-500' : 'text-slate-600'}`}>
      {met ? <CheckCircle size={12} /> : <XCircle size={12} />} {text}
    </div>
  );
}