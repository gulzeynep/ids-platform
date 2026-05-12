import axios, { AxiosError, type AxiosInstance, type InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '../stores/auth.store';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';
const REQUEST_TIMEOUT = 30000; 
const DEMO_EMAIL = import.meta.env.VITE_DEMO_EMAIL || 'demo@wids.local';
const DEMO_PASSWORD = import.meta.env.VITE_DEMO_PASSWORD || 'DemoPass123!';
const DEMO_AUTO_LOGIN = import.meta.env.DEV && import.meta.env.VITE_DEMO_AUTO_LOGIN !== 'false';

type RetryableRequestConfig = InternalAxiosRequestConfig & { _retry?: boolean };

let demoRefreshPromise: Promise<string> | null = null;

const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: REQUEST_TIMEOUT,
  headers: {'Content-Type': 'application/json',},
});

apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = useAuthStore.getState().token;
    
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

const refreshDemoToken = async (): Promise<string> => {
  if (!demoRefreshPromise) {
    const formData = new URLSearchParams();
    formData.append('username', DEMO_EMAIL);
    formData.append('password', DEMO_PASSWORD);

    demoRefreshPromise = axios.post(`${API_BASE_URL}/auth/token`, formData, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      timeout: REQUEST_TIMEOUT,
    }).then(async (response) => {
      const token = response.data.access_token as string;
      const userResponse = await axios.get(`${API_BASE_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: REQUEST_TIMEOUT,
      });
      useAuthStore.getState().setAuth(token, userResponse.data, Boolean(userResponse.data.workspace_id));
      return token;
    }).finally(() => {
      demoRefreshPromise = null;
    });
  }

  return demoRefreshPromise;
};

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as RetryableRequestConfig | undefined;

    if (
      DEMO_AUTO_LOGIN &&
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !originalRequest.url?.includes('/auth/token')
    ) {
      originalRequest._retry = true;
      const token = await refreshDemoToken();
      originalRequest.headers.Authorization = `Bearer ${token}`;
      return apiClient(originalRequest);
    }

    return Promise.reject(error);
  }
);

export const isApiError = (error: unknown): error is AxiosError => axios.isAxiosError(error);
export default apiClient;
