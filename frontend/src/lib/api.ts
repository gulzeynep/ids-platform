import axios from 'axios';

// Backend'in adresi
const api = axios.create({
  baseURL: 'http://localhost:8000',
});

// ARAYA GİRİCİ (INTERCEPTOR): Her istekten önce çalışır
api.interceptors.request.use((config) => {
  // Cüzdandan (localStorage) token'ı al
  const token = localStorage.getItem('token');
  
  // Eğer token varsa, bunu yakamıza (Headers) yapıştır
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  return config;
}, (error) => {
  return Promise.reject(error);
});

export const blacklistIP = async (ip: string, reason: string) => {
  return await api.post(`/security/blacklist/${ip}`, { reason });
};
export const getBlacklist = async () => {
  return await api.get('/security/blacklist');
};

export default api;