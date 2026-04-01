import { useState } from 'react';
import { Shield, User, Lock, Building, ArrowLeft, Mail } from 'lucide-react';
import api from '../lib/api';

interface RegisterProps { 
    onRegisterSuccess: () => void; 
    onBack: () => void; }

interface InputGroupProps {
  icon: React.ReactNode;
  label: string;
  placeholder: string;
  type?: string;
  onChange: (value: string) => void; 
}

export default function Register({ onRegisterSuccess, onBack }: RegisterProps) {
  const [formData, setFormData] = useState({ email: '', password: '', confirmPassword: '', company: '', username: '' });
  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  if (formData.password !== formData.confirmPassword) {
    alert("Şifreler eşleşmiyor!");
    return;
  }
  try { 
    await api.post('/auth/register', {
      username: formData.username,
      email: formData.email,
      password: formData.password,
      company_name: formData.company
    }); 
    onRegisterSuccess(); 
  } catch (err) { alert("Kayıt başarısız."); }
};

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      <nav className="border-b border-white/5 p-4 flex justify-between items-center bg-black/50 backdrop-blur-md">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 font-bold cursor-pointer" onClick={onBack}><Shield className="text-blue-500 w-5 h-5" /><span>W-IDS</span></div>
        </div>
        <div className="flex gap-4 items-center">
          <button onClick={onBack} className="text-[10px] font-black text-slate-400 hover:text-white uppercase tracking-widest">Home</button>
          <button onClick={() => window.dispatchEvent(new CustomEvent('setView', {detail: 'contact'}))} className="text-[10px] font-black text-slate-400 hover:text-white uppercase tracking-widest">Contact</button>
          <button onClick={onRegisterSuccess} className="bg-white text-black px-4 py-1.5 rounded-full text-[10px] font-black uppercase hover:bg-blue-500 hover:text-white transition-all">Login</button>        </div>
      </nav>

      <div className="flex items-center justify-center p-6 mt-10">
        <div className="w-full max-w-md bg-[#0a0a0a] border border-white/5 p-8 rounded-[32px] shadow-2xl">
          <h2 className="text-xl font-black text-center uppercase tracking-tighter mb-8 italic">New Identity Registration</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <InputGroup icon={<User size={16}/>} label="Username" placeholder="Operator Name" onChange={v => setFormData({...formData, username: v})} />
            <InputGroup icon={<Building size={16}/>} label="Organization" placeholder="Cyber Defense Unit" onChange={v => setFormData({...formData, company: v})} />
            <InputGroup icon={<Mail size={16}/>} label="Email Address" placeholder="operator@company.com" onChange={v => setFormData({...formData, email: v})} />
            <InputGroup icon={<Lock size={16}/>} label="Access Key" type="password" placeholder="••••••••" onChange={v => setFormData({...formData, password: v})} />
            <InputGroup icon={<Lock size={16}/>} label="Confirm Access Key" type="password" placeholder="••••••••" onChange={v => setFormData({...formData, confirmPassword: v})} />
            <button type="submit" className="w-full bg-blue-600 py-4 rounded-xl font-black hover:bg-blue-500 transition-all uppercase tracking-widest mt-4">Initialize Identity</button>
          </form>
        </div>
      </div>
    </div>
  );
}

function InputGroup({ icon, label, placeholder, type = "text", onChange }: InputGroupProps) {
  return (
    <div className="space-y-1">
      <label className="text-[10px] font-black text-slate-500 uppercase ml-1 tracking-widest">
        {label}
      </label>
      <div className="relative">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600">
          {icon}
        </div>
        <input 
          type={type} 
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.value)} 
          className="w-full bg-black border border-white/5 rounded-xl py-3 pl-12 pr-4 text-sm text-white placeholder-slate-700 outline-none focus:border-blue-500/50 transition-all" 
          placeholder={placeholder} 
        />
      </div>
    </div>
  );
}