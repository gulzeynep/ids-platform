import { useState } from 'react';
import { Shield, User, Lock, Building, Mail } from 'lucide-react';
import api from '../lib/api';

interface RegisterProps { onRegisterSuccess: () => void; onBack: () => void; }
interface InputGroupProps {
  icon: React.ReactNode;
  label: string;
  placeholder: string;
  type?: string;
  onChange: (value: string) => void; // value'nun string olduğunu belirttik
}
export default function Register({ onRegisterSuccess, onBack }: RegisterProps) {
  const [formData, setFormData] = useState({ 
    email: '', 
    password: '', 
    confirmPassword: '', 
    company: '', 
    username: '' 
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      alert("Error: Passwords do no match!");
      return;
    }

    try { 
      await api.post('/auth/register', {
        username: formData.username,
        email: formData.email,
        password: formData.password,
        company_name: formData.company
      }); 

      const params = new URLSearchParams();
      params.append('username', formData.email); 
      params.append('password', formData.password);
      
      const loginRes = await api.post('/auth/token', params, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      });
      

      localStorage.setItem('token', loginRes.data.access_token);
      onRegisterSuccess(); 

    } catch (err) { 
      alert("Unsuccessfull: Chehck your information or this email address may already be in use."); 
    }
  };

  
  return (
    <div className="min-h-screen bg-[#050505] text-white selection:bg-blue-500/30">
      <nav className="border-b border-white/5 p-4 flex justify-between items-center bg-black/50 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-2 font-bold cursor-pointer" onClick={onBack}>
          <Shield className="text-blue-500 w-5 h-5" /> <span>W-IDS</span>
        </div>
        <div className="flex gap-4 items-center font-black text-[10px] tracking-widest">
          <button onClick={onBack} className="text-slate-400 hover:text-white uppercase">Home</button>
          <button onClick={() => window.dispatchEvent(new CustomEvent('setView', {detail: 'contact'}))} className="text-slate-400 hover:text-white uppercase border-l border-white/10 pl-4">Contact</button>
          <button onClick={onRegisterSuccess} className="bg-white text-black px-4 py-1.5 rounded-full hover:bg-blue-500 hover:text-white transition-all uppercase">Login</button>
        </div>
      </nav>

      <div className="flex items-center justify-center p-6 mt-10">
        <div className="w-full max-w-md bg-[#0a0a0a] border border-white/5 p-8 rounded-[32px] shadow-2xl animate-in fade-in zoom-in duration-500">
          <h2 className="text-xl font-black text-center uppercase tracking-tighter mb-8 italic italic">New Identity Registration</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <InputGroup icon={<User size={16}/>} label="Operator ID / Name" placeholder="j.doe" onChange={v => setFormData({...formData, username: v})} />
            <InputGroup icon={<Building size={16}/>} label="Organization" placeholder="Cyber Defense Unit" onChange={v => setFormData({...formData, company: v})} />
            <InputGroup icon={<Mail size={16}/>} label="Email Address" placeholder="operator@company.com" onChange={v => setFormData({...formData, email: v})} />
            <InputGroup icon={<Lock size={16}/>} label="Access Key" type="password" placeholder="••••••••" onChange={v => setFormData({...formData, password: v})} />
            <InputGroup icon={<Lock size={16}/>} label="Confirm Access Key" type="password" placeholder="••••••••" onChange={v => setFormData({...formData, confirmPassword: v})} />
            <button type="submit" className="w-full bg-blue-600 py-4 rounded-xl font-black hover:bg-blue-500 transition-all uppercase tracking-widest mt-4 shadow-lg shadow-blue-600/20">Initialize Identity</button>
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
          required
          // e.target.value her zaman string döner, o yüzden güvenlidir
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.value)} 
          className="w-full bg-black border border-white/5 rounded-xl py-3 pl-12 pr-4 text-sm text-white placeholder-slate-700 outline-none focus:border-blue-500/50 transition-all" 
          placeholder={placeholder} 
        />
      </div>
    </div>
  );
}
