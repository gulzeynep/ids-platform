import axios from 'axios';

// Automatically use the Vite environment variable, fallback to localhost for local dev
const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL,
});

// REQUEST INTERCEPTOR: Runs before every request
api.interceptors.request.use((config) => {
  // Read from local storage directly for the interceptor
  const token = localStorage.getItem('token');
  
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  return config;
}, (error) => {
  return Promise.reject(error);
});

export default api;