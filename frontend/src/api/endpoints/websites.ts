import apiClient from '../client';

export interface MonitoredWebsite {
  id: number;
  domain: string;
  target_ip: string;
  target_port: number;
  is_active: boolean;
  created_at: string;
  workspace_id: number;
}

export interface WebsiteCreateRequest {
  domain: string;
  target_ip: string;
  target_port?: number;
}

export const getMonitoredWebsites = async (): Promise<MonitoredWebsite[]> => {
  const { data } = await apiClient.get<MonitoredWebsite[]>('/websites/');
  return data;
};

export const addMonitoredWebsite = async (websiteData: WebsiteCreateRequest): Promise<MonitoredWebsite> => {
  const { data } = await apiClient.post<MonitoredWebsite>('/websites/', websiteData);
  return data;
};

export const deleteMonitoredWebsite = async (id: number): Promise<void> => {
  await apiClient.delete(`/websites/${id}`);
};
