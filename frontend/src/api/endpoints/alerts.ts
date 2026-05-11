import apiClient from '../client';
import type { 
  Alert, 
  AlertUpdateDto, 
  AlertFilters
} from '../../types';


export const alertsApi = {
  
  getAlerts: async (
    filters: AlertFilters = {},
    page = 0,
    limit = 50
  ): Promise<Alert[]> => {
    const params = new URLSearchParams();
    
    
    if (filters.status && filters.status !== 'all') {
      params.append('status', filters.status);
    }
    if (filters.severity && filters.severity !== 'all') {
      params.append('severity', filters.severity);
    }
    if (filters.is_flagged !== null && filters.is_flagged !== undefined) {
      params.append('is_flagged', String(filters.is_flagged));
    }
    if (filters.is_saved !== null && filters.is_saved !== undefined) {
      params.append('is_saved', String(filters.is_saved));
    }
    if (filters.search) {
      params.append('search', filters.search);
    }
    if (filters.start_date) {
      params.append('start_date', filters.start_date);
    }
    if (filters.end_date) {
      params.append('end_date', filters.end_date);
    }
    
    params.append('limit', String(limit));
    params.append('offset', String(page * limit));

    const response = await apiClient.get('/alerts/', { params });
    return response.data;
  },


  updateAlert: async (id: number, data: AlertUpdateDto): Promise<Alert> => {
    const response = await apiClient.patch(`/alerts/${id}/triage`, data);
    return response.data;
  },

  getAlert: async (id: number): Promise<Alert> => {
    const response = await apiClient.get(`/alerts/${id}`);
    return response.data;
  },

  getAlertStats: async () => {
    const response = await apiClient.get('/alerts/stats/dashboard'); 
    return response.data;
  }
};


export const alertKeys = {
  all: ['alerts'] as const,
  stats: () => [...alertKeys.all, 'stats'] as const,
  lists: () => [...alertKeys.all, 'list'] as const,
  list: (filters: AlertFilters, page: number) => 
    [...alertKeys.lists(), filters, page] as const,
  details: () => [...alertKeys.all, 'detail'] as const,
  detail: (id: number) => [...alertKeys.details(), id] as const,
};
