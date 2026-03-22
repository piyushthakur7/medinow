'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth';
import { Loader2 } from 'lucide-react';

export default function HomePage() {
    const router = useRouter();
    const { token, isLoading, checkAuth } = useAuthStore();

    useEffect(() => {
        const init = async () => {
            await checkAuth();
        };
        init();
    }, [checkAuth]);

    useEffect(() => {
        if (!isLoading) {
            if (token) {
                router.replace('/dashboard');
            } else {
                router.replace('/login');
            }
        }
    }, [token, isLoading, router]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-primary-500">
            <div className="text-center">
                <img src="/logo.png" alt="MediNow" className="w-24 h-24 mx-auto mb-4" />
                <Loader2 className="w-8 h-8 text-white animate-spin mx-auto" />
            </div>
        </div>
    );
}
