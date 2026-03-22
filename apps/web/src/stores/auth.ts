import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { api } from '@/lib/api';

interface User {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    planType: string;
}

interface AuthResponse {
    user: User;
    token: string;
}

interface AuthState {
    user: User | null;
    token: string | null;
    isLoading: boolean;
    error: string | null;

    login: (credentials: { email?: string; phone?: string; password: string }) => Promise<boolean>;
    signup: (data: { name: string; email?: string; phone?: string; password: string }) => Promise<boolean>;
    logout: () => void;
    checkAuth: () => Promise<void>;
    clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            user: null,
            token: null,
            isLoading: true,
            error: null,

            login: async (credentials: { email?: string; phone?: string; password: string }) => {
                set({ isLoading: true, error: null });
                try {
                    const response = await api.post<AuthResponse>('/auth/login', credentials);
                    if (response.success && response.data) {
                        set({
                            user: response.data.user,
                            token: response.data.token,
                            isLoading: false,
                        });
                        return true;
                    }
                    set({ error: response.error?.message || 'Login failed', isLoading: false });
                    return false;
                } catch (error: unknown) {
                    const message = error instanceof Error ? error.message : 'Login failed';
                    set({ error: message, isLoading: false });
                    return false;
                }
            },

            signup: async (data: { name: string; email?: string; phone?: string; password: string }) => {
                set({ isLoading: true, error: null });
                try {
                    const response = await api.post<AuthResponse>('/auth/signup', data);
                    if (response.success && response.data) {
                        set({
                            user: response.data.user,
                            token: response.data.token,
                            isLoading: false,
                        });
                        return true;
                    }
                    set({ error: response.error?.message || 'Signup failed', isLoading: false });
                    return false;
                } catch (error: unknown) {
                    const message = error instanceof Error ? error.message : 'Signup failed';
                    set({ error: message, isLoading: false });
                    return false;
                }
            },

            logout: () => {
                set({ user: null, token: null, error: null });
            },

            checkAuth: async () => {
                const { token } = get();
                if (!token) {
                    set({ isLoading: false });
                    return;
                }

                try {
                    const response = await api.get<{ user: User }>('/auth/me');
                    if (response.success && response.data) {
                        set({ user: response.data.user, isLoading: false });
                    } else {
                        set({ user: null, token: null, isLoading: false });
                    }
                } catch {
                    set({ user: null, token: null, isLoading: false });
                }
            },

            clearError: () => set({ error: null }),
        }),
        {
            name: 'meditrack-auth',
            partialize: (state: AuthState) => ({ token: state.token }),
        }
    )
);
