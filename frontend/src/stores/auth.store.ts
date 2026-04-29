import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  email: string;
  full_name?: string;
  role: 'admin' | 'analyst';
  workspace_id?: number | null;
  user_persona?: string;
  is_active?: boolean;
}

interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  hasWorkspace: boolean;
  
  setAuth: (token: string, user: User, hasWorkspace: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      isAuthenticated: false,
      hasWorkspace: true, 
      
      setAuth: (token, user, hasWorkspace) => 
        set({ token, user, isAuthenticated: true, hasWorkspace }),
        
      logout: () => 
        set({ token: null, user: null, isAuthenticated: false, hasWorkspace: false }),
    }),
    { name: 'wids-auth-storage' }
  )
);