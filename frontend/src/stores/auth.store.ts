import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthState {
  token: string | null;
  role: string | null;
  isAuthenticated: boolean;
  hasWorkspace: boolean;
  
  setAuth: (token: string, hasWorkspace: boolean, role: string) => void;
  logout: () => void;
  setWorkspaceStatus: (status: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      role: null,
      isAuthenticated: false,
      hasWorkspace: false,
      
      setAuth: (token, hasWorkspace, role) => 
        set({ isAuthenticated: true, hasWorkspace, token, role }),
        
      logout: () => 
        set({ isAuthenticated: false, hasWorkspace: false, token: null, role: null }),
        
      setWorkspaceStatus: (status) => 
        set({ hasWorkspace: status }),
    }),
    {
      name: 'wids-auth-storage', 
    }
  )
);