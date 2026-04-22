// src/stores/auth.store.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  email: string;
  role: 'admin' | 'analyst';
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
      hasWorkspace: true, // Kayıtla beraber workspace oluştuğu için varsayılan true
      
      setAuth: (token, user, hasWorkspace) => 
        set({ token, user, isAuthenticated: true, hasWorkspace }),
        
      logout: () => 
        set({ token: null, user: null, isAuthenticated: false, hasWorkspace: false }),
    }),
    { name: 'wids-auth-storage' }
  )
);