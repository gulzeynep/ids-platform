import { create } from 'zustand';
import type { Modal, Toast } from '../types';

interface UIState {
  // Sidebar
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  
  // Modal
  modal: Modal;
  openModal: (title: string, content: React.ReactNode, onClose?: () => void) => void;
  closeModal: () => void;
  
  // Loading overlay
  isLoading: boolean;
  setLoading: (loading: boolean) => void;
  
  // Toasts
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
  
  // Theme
  theme: 'dark' | 'light';
  setTheme: (theme: 'dark' | 'light') => void;
}

export const useUIStore = create<UIState>((set) => ({
  // Sidebar
  sidebarOpen: true,
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  
  // Modal
  modal: {
    isOpen: false,
    title: '',
    content: null,
  },
  openModal: (title, content, onClose) => set({
    modal: { isOpen: true, title, content, onClose },
  }),
  closeModal: () => set((state) => {
    state.modal.onClose?.();
    return {
      modal: { isOpen: false, title: '', content: null },
    };
  }),
  
  // Loading
  isLoading: false,
  setLoading: (loading) => set({ isLoading: loading }),
  
  // Toasts
  toasts: [],
  addToast: (toast) => set((state) => ({
    toasts: [...state.toasts, { ...toast, id: Math.random().toString(36).substr(2, 9) }],
  })),
  removeToast: (id) => set((state) => ({
    toasts: state.toasts.filter((t) => t.id !== id),
  })),
  
  // Theme
  theme: 'dark',
  setTheme: (theme) => set({ theme }),
}));