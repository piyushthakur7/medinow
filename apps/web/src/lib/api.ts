import { useAuthStore } from '@/stores/auth';
import { mockRequest } from './mock-api';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api';
const MOCK_ENABLED = true; // Always on as requested for "unattached" backend

interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    error?: {
        message: string;
        code?: string;
        details?: string[];
    };
}

class ApiClient {
    private getHeaders(): HeadersInit {
        const headers: HeadersInit = {
            'Content-Type': 'application/json',
        };

        const token = useAuthStore.getState().token;
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        return headers;
    }

    async request<T>(
        endpoint: string,
        options: RequestInit = {}
    ): Promise<ApiResponse<T>> {
        if (MOCK_ENABLED) {
            return mockRequest(endpoint, options);
        }

        const url = `${API_BASE}${endpoint}`;

        try {
            const response = await fetch(url, {
                ...options,
                headers: {
                    ...this.getHeaders(),
                    ...options.headers,
                },
            });

            const data = await response.json();

            if (!response.ok) {
                // Handle 401 - token expired
                if (response.status === 401) {
                    useAuthStore.getState().logout();
                }

                return {
                    success: false,
                    error: data.error || { message: 'Request failed' },
                };
            }

            return data;
        } catch (error: any) {
            return {
                success: false,
                error: { message: error.message || 'Network error' },
            };
        }
    }

    get<T>(endpoint: string): Promise<ApiResponse<T>> {
        return this.request<T>(endpoint, { method: 'GET' });
    }

    post<T>(endpoint: string, body?: any): Promise<ApiResponse<T>> {
        return this.request<T>(endpoint, {
            method: 'POST',
            body: body ? JSON.stringify(body) : undefined,
        });
    }

    put<T>(endpoint: string, body?: any): Promise<ApiResponse<T>> {
        return this.request<T>(endpoint, {
            method: 'PUT',
            body: body ? JSON.stringify(body) : undefined,
        });
    }

    delete<T>(endpoint: string): Promise<ApiResponse<T>> {
        return this.request<T>(endpoint, { method: 'DELETE' });
    }
}

export const api = new ApiClient();
