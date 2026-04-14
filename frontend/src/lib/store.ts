import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthState {
    isAuthenticated: boolean;
    hasWorkspace: boolean;
    token: string | null;
    role: string | null;
    setAuth: (token: string, hasWorkspace: boolean, role: string) => void;
    logout: () => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            isAuthenticated: false,
            hasWorkspace: false,
            token: null,
            role: null,
            setAuth: (token, hasWorkspace, role) => set({ isAuthenticated: true, hasWorkspace, token, role }),
            logout: () => set({ isAuthenticated: false, hasWorkspace: false, token: null, role: null })
        }),
        {
            name: 'wids-auth-storage', 
        }
    )
);