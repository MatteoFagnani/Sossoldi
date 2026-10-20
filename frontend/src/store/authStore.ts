import { create } from 'zustand';
import type { User } from '../types';
import api from '../services/api';

interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
    isCheckingAuth: boolean;
    setAuth: (user: User) => void;
    checkAuth: () => Promise<boolean>;
    logout: () => Promise<void>;
}

// Load from localStorage for persistence
const storedUser = localStorage.getItem('user');

let initialUser: User | null = null;
if (storedUser && storedUser !== 'undefined') {
    try {
        initialUser = JSON.parse(storedUser);
    } catch (e) {
        console.error("Failed to parse user from localStorage", e);
    }
}

export const useAuthStore = create<AuthState>((set) => ({
    user: initialUser,
    isAuthenticated: !!initialUser,
    isCheckingAuth: true,
    setAuth: (user) => {
        localStorage.setItem('user', JSON.stringify(user));
        set({ user, isAuthenticated: true, isCheckingAuth: false });
    },
    checkAuth: async () => {
        try {
            const res = await api.get<{ authenticated: boolean; user?: User }>('/auth/me');
            if (res.data.authenticated && res.data.user) {
                localStorage.setItem('user', JSON.stringify(res.data.user));
                set({ user: res.data.user, isAuthenticated: true, isCheckingAuth: false });
                return true;
            } else {
                localStorage.removeItem('user');
                set({ user: null, isAuthenticated: false, isCheckingAuth: false });
                return false;
            }
        } catch {
            localStorage.removeItem('user');
            set({ user: null, isAuthenticated: false, isCheckingAuth: false });
            return false;
        }
    },
    logout: async () => {
        try {
            await api.post('/auth/logout');
        } catch (error) {
            console.error('Logout failed', error);
        } finally {
            localStorage.removeItem('user');
            set({ user: null, isAuthenticated: false, isCheckingAuth: false });
            window.location.href = '/login';
        }
    },
}));
