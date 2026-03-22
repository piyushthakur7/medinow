'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth';
import { api } from '@/lib/api';
import {
    ArrowLeft,
    Bell,
    AlertTriangle,
    Package,
    TrendingUp,
    Loader2,
    Check,
} from 'lucide-react';

interface Alert {
    id: string;
    alertType: string;
    status: string;
    message: string;
    createdAt: string;
    medicine?: {
        id: string;
        name: string;
    };
}

export default function AlertsPage() {
    const router = useRouter();
    const { token } = useAuthStore();

    const [alerts, setAlerts] = useState<Alert[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!token) {
            router.replace('/login');
            return;
        }
        loadAlerts();
    }, [token]);

    const loadAlerts = async () => {
        setIsLoading(true);
        try {
            const res = await api.get<{ alerts: Alert[] }>('/alerts?limit=50');
            if (res.success && res.data) {
                setAlerts(res.data.alerts);
            }
        } catch (error) {
            console.error('Failed to load alerts:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const markAsRead = async (alertIds: string[]) => {
        try {
            await api.post('/alerts/mark-read', { alertIds });
            setAlerts(alerts.map(a =>
                alertIds.includes(a.id) ? { ...a, status: 'READ' } : a
            ));
        } catch (error) {
            console.error('Failed to mark as read:', error);
        }
    };

    const markAllAsRead = async () => {
        try {
            await api.post('/alerts/mark-all-read');
            setAlerts(alerts.map(a => ({ ...a, status: 'READ' })));
        } catch (error) {
            console.error('Failed to mark all as read:', error);
        }
    };

    const getAlertIcon = (type: string) => {
        switch (type) {
            case 'EXPIRY':
                return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
            case 'LOW_STOCK':
                return <Package className="w-5 h-5 text-red-600" />;
            case 'SAVINGS_SUMMARY':
                return <TrendingUp className="w-5 h-5 text-green-600" />;
            default:
                return <Bell className="w-5 h-5 text-gray-600" />;
        }
    };

    const getAlertBg = (type: string) => {
        switch (type) {
            case 'EXPIRY':
                return 'bg-yellow-100';
            case 'LOW_STOCK':
                return 'bg-red-100';
            case 'SAVINGS_SUMMARY':
                return 'bg-green-100';
            default:
                return 'bg-gray-100';
        }
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const days = Math.floor(hours / 24);

        if (hours < 1) return 'Just now';
        if (hours < 24) return `${hours}h ago`;
        if (days < 7) return `${days}d ago`;
        return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
    };

    const unreadCount = alerts.filter(a => a.status !== 'READ').length;

    return (
        <div className="min-h-screen bg-gray-50 pb-6">
            {/* Header */}
            <header className="bg-white border-b sticky top-0 z-10">
                <div className="px-4 py-3 flex items-center gap-3">
                    <button onClick={() => router.back()} className="p-2 -ml-2">
                        <ArrowLeft className="w-5 h-5 text-gray-600" />
                    </button>
                    <h1 className="text-lg font-semibold text-gray-900 flex-1">Alerts</h1>
                    {unreadCount > 0 && (
                        <button
                            onClick={markAllAsRead}
                            className="text-primary-600 text-sm font-medium flex items-center gap-1"
                        >
                            <Check className="w-4 h-4" />
                            Mark all read
                        </button>
                    )}
                </div>
            </header>

            {/* Content */}
            <div className="px-4 mt-4">
                {isLoading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
                    </div>
                ) : alerts.length === 0 ? (
                    <div className="text-center py-12">
                        <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500">No alerts yet</p>
                        <p className="text-sm text-gray-400 mt-1">
                            We'll notify you about expiring medicines and low stock
                        </p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {alerts.map((alert) => (
                            <div
                                key={alert.id}
                                onClick={() => {
                                    if (alert.status !== 'READ') {
                                        markAsRead([alert.id]);
                                    }
                                    if (alert.medicine) {
                                        router.push(`/medicines/${alert.medicine.id}`);
                                    }
                                }}
                                className={`card flex items-start gap-3 cursor-pointer ${alert.status !== 'READ' ? 'border-l-4 border-primary-500' : ''
                                    }`}
                            >
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getAlertBg(alert.alertType)}`}>
                                    {getAlertIcon(alert.alertType)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className={`text-gray-900 ${alert.status !== 'READ' ? 'font-medium' : ''}`}>
                                        {alert.message}
                                    </p>
                                    <p className="text-sm text-gray-500 mt-1">
                                        {formatDate(alert.createdAt)}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
