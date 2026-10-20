/// <reference types="vite/client" />
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api/v1';

const api = axios.create({
    baseURL: API_URL,
    headers: { 'Content-Type': 'application/json' },
    withCredentials: true,
});

// Response interceptor: handle 401
api.interceptors.response.use(
    (response) => response,
    (error) => {
        const status = error.response?.status;
        const requestUrl = String(error.config?.url || '');
        const isAuthRequest = requestUrl.includes('/auth/') || requestUrl.includes('/users/me');
        const isPublicAuthPage = window.location.pathname === '/login' || window.location.pathname === '/register';

        if (status === 401 && !isAuthRequest && !isPublicAuthPage) {
            localStorage.removeItem('user');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default api;
