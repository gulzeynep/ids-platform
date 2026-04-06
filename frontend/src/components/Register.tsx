import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Mail, Lock, User, Building, Loader2, ArrowRight, CheckCircle, XCircle } from 'lucide-react';
import api from '../lib/api';

export default function Register() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ username: '', email: '', password: '', company_name: '', full_name: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Şifre Güvenlik Kontrolü
  const passChecks = {
    length: formData.password.length >= 8,
    upper: /[A-Z]/.test(formData.password),
    number: /[0-9]/.test(formData.password),
    special: /[!@#$%^&*]/.test(formData.password)
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!Object.values(passChecks).every(Boolean)) {
      setError("Password does not meet security requirements.");
      return;
    }

    setLoading(true);
    try {
      await api.post('/auth/register', formData);
      navigate('/login');
    } catch (err: any) {
      setError(err.response?.data?.detail || "Registration failed.");
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
          <h2 className="text-3xl font-black italic tracking-tighter">INITIALIZE ACCOUNT</h2>
        </div>

        <form onSubmit={handleRegister} className="bg-[#0a0a0a] border border-white/5 rounded-[40px] p-8 space-y-4 shadow-2xl">
          {error && <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] font-black uppercase rounded-2xl">{error}</div>}
          
          <input type="text" placeholder="FULL NAME" required className="w-full bg-black border border-white/10 rounded-2xl p-4 text-sm outline-none focus:border-blue-500/50" onChange={e => setFormData({...formData, full_name: e.target.value})} />
          <input type="email" placeholder="EMAIL ADDRESS" required className="w-full bg-black border border-white/10 rounded-2xl p-4 text-sm outline-none focus:border-blue-500/50" onChange={e => setFormData({...formData, email: e.target.value})} />
          <input type="text" placeholder="COMPANY NAME" required className="w-full bg-black border border-white/10 rounded-2xl p-4 text-sm outline-none focus:border-blue-500/50" onChange={e => setFormData({...formData, company_name: e.target.value})} />
          
          <div className="relative">
            <input type="password" placeholder="SECURE PASSWORD" required className="w-full bg-black border border-white/10 rounded-2xl p-4 text-sm outline-none focus:border-blue-500/50" onChange={e => setFormData({...formData, password: e.target.value})} />
            
            {/* ŞİFRE GÜCÜ GÖSTERGESİ */}
            <div className="mt-4 grid grid-cols-2 gap-2">
              <PasswordRule met={passChecks.length} text="8+ Characters" />
              <PasswordRule met={passChecks.upper} text="1 Uppercase" />
              <PasswordRule met={passChecks.number} text="1 Number" />
              <PasswordRule met={passChecks.special} text="1 Special Symbol" />
            </div>
          </div>

          <button disabled={loading} className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-2xl uppercase text-[10px] tracking-widest transition-all mt-6 shadow-lg shadow-blue-500/20">
            {loading ? <Loader2 className="animate-spin mx-auto" /> : "Deploy Account"}
          </button>
        </form>
      </div>
    </div>
  );
}

function PasswordRule({ met, text }: { met: boolean; text: string }) {
  return (
    <div className={`flex items-center gap-2 text-[9px] font-black uppercase tracking-widest ${met ? 'text-green-500' : 'text-slate-600'}`}>
      {met ? <CheckCircle size={10} /> : <XCircle size={10} />} {text}
    </div>
  );
}