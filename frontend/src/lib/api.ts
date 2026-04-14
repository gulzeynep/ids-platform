import axios from 'axios';
import { useAuthStore } from './store';

const api = axios.create({
    baseURL: 'http://localhost:8000', // Backend address
    headers: {
        'Content-Type': 'application/json',
    },
});

// Interceptor: will add token in every request
api.interceptors.request.use((config) => {
    const token = useAuthStore.getState().token;
    if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

export default api;