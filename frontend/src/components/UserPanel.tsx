import { useAuthStore } from '../lib/store';
import { User, LogOut, ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const UserPanel = () => {
  const [isOpen, setIsOpen] = useState(false);
  const logout = useAuthStore(state => state.logout);
  const navigate = useNavigate();

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 p-2 rounded-full transition-all border border-slate-700"
      >
        <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
          <User className="text-white w-4 h-4" />
        </div>
        <ChevronDown className={`text-slate-500 w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl py-2 z-50">
          <button onClick={() => { navigate('/profile'); setIsOpen(false); }} className="w-full text-left px-4 py-2 text-sm text-slate-300 hover:bg-slate-800 flex items-center gap-2">
            <User className="w-4 h-4" /> Profile Details
          </button>
          <div className="h-px bg-slate-800 my-2" />
          <button onClick={() => { logout(); navigate('/login'); }} className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 flex items-center gap-2">
            <LogOut className="w-4 h-4" /> Terminate Session
          </button>
        </div>
      )}
    </div>
  );
};

export default UserPanel;