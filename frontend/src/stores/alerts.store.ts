import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { Alert, AlertFilters, RealtimeAlert } from '../types';

interface AlertsState {
  // State
  alerts: Alert[];
  realtimeAlerts: RealtimeAlert[];
  selectedAlert: Alert | null;
  filters: AlertFilters;
  isWsConnected: boolean;
  
  // Actions
  setAlerts: (alerts: Alert[]) => void;
  addAlert: (alert: Alert) => void;
  addRealtimeAlert: (alert: RealtimeAlert) => void;
  updateAlert: (id: number, updates: Partial<Alert>) => void;
  removeAlert: (id: number) => void;
  setSelectedAlert: (alert: Alert | null) => void;
  setFilters: (filters: Partial<AlertFilters>) => void;
  resetFilters: () => void;
  clearRealtimeAlerts: () => void;
  setWsConnected: (status: boolean) => void;
}

const defaultFilters: AlertFilters = {
  status: 'all',
  severity: 'all',
  is_flagged: null,
  is_saved: null,
  search: '',
};

export const useAlertsStore = create<AlertsState>()(
  devtools(
    (set) => ({
      // Initial State
      alerts: [],
      realtimeAlerts: [],
      selectedAlert: null,
      filters: defaultFilters,
      isWsConnected: false,

      setAlerts: (alerts) => set({ alerts }),
      
      addAlert: (alert) => set((state) => ({
        alerts: [alert, ...state.alerts],
      })),
      
      addRealtimeAlert: (alert) => set((state) => ({
        realtimeAlerts: [alert, ...state.realtimeAlerts].slice(0, 100), // Keep last 100
      })),
      
      updateAlert: (id, updates) => set((state) => ({
        alerts: state.alerts.map((alert) =>
          alert.id === id ? { ...alert, ...updates } : alert
        ),
        selectedAlert: 
          state.selectedAlert?.id === id 
            ? { ...state.selectedAlert, ...updates } 
            : state.selectedAlert,
      })),
      
      removeAlert: (id) => set((state) => ({
        alerts: state.alerts.filter((alert) => alert.id !== id),
        selectedAlert: state.selectedAlert?.id === id ? null : state.selectedAlert,
      })),
      
      setSelectedAlert: (alert) => set({ selectedAlert: alert }),
      
      setFilters: (filters) => set((state) => ({
        filters: { ...state.filters, ...filters },
      })),
      
      resetFilters: () => set({ filters: defaultFilters }),
      
      clearRealtimeAlerts: () => set({ realtimeAlerts: [] }),

      setWsConnected: (status) => set({ isWsConnected: status }),
    }),
    { name: 'alerts-store' }
  )
);
