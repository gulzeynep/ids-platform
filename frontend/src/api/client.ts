import axios, { AxiosError, type AxiosInstance, type InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '../stores/auth.store';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const REQUEST_TIMEOUT = 30000; 

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

export const isApiError = (error: unknown): error is AxiosError => axios.isAxiosError(error);
export default apiClient;