'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth';
import { api } from '@/lib/api';
import {
    Package,
    AlertTriangle,
    TrendingUp,
    Plus,
    Bell,
    Search,
    Menu,
    LogOut,
    Loader2,
    X,
    ChevronRight,
} from 'lucide-react';
import Link from 'next/link';

interface DashboardStats {
    totalMedicines: number;
    expiringCount: number;
    lowStockCount: number;
    monthlySavings: number;
}

interface Medicine {
    id: string;
    name: string;
    currentStock: number;
    expiryDate: string;
    expiryStatus: string;
}

export default function DashboardPage() {
    const router = useRouter();
    const { user, token, logout, isLoading: authLoading } = useAuthStore();

    const [stats, setStats] = useState<DashboardStats>({
        totalMedicines: 0,
        expiringCount: 0,
        lowStockCount: 0,
        monthlySavings: 0,
    });
    const [recentMedicines, setRecentMedicines] = useState<Medicine[]>([]);
    const [alerts, setAlerts] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showMenu, setShowMenu] = useState(false);

    useEffect(() => {
        if (!authLoading && !token) {
            router.replace('/login');
        }
    }, [token, authLoading, router]);

    useEffect(() => {
        if (token) {
            loadDashboardData();
        }
    }, [token]);

    const loadDashboardData = async () => {
        setIsLoading(true);
        try {
            const [medicinesRes, alertsRes, savingsRes] = await Promise.all([
                api.get<{ medicines: Medicine[]; count: number }>('/medicines'),
                api.get<{ alerts: any[]; unreadCount: number }>('/alerts?limit=5'),
                api.get<{ monthlySavings: any[]; totalSavings: number }>('/savings/monthly?months=1'),
            ]);

            if (medicinesRes.success && medicinesRes.data) {
                const medicines = medicinesRes.data.medicines;
                setRecentMedicines(medicines.slice(0, 5));
                setStats(prev => ({
                    ...prev,
                    totalMedicines: medicines.length,
                    expiringCount: medicines.filter(m => m.expiryStatus === 'EXPIRING_SOON' || m.expiryStatus === 'EXPIRED').length,
                    lowStockCount: medicines.filter(m => m.currentStock <= 10).length,
                }));
            }

            if (alertsRes.success && alertsRes.data) {
                setAlerts(alertsRes.data.alerts);
            }

            if (savingsRes.success && savingsRes.data) {
                setStats(prev => ({
                    ...prev,
                    monthlySavings: savingsRes.data!.totalSavings || 0,
                }));
            }
        } catch (error) {
            console.error('Failed to load dashboard data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleLogout = () => {
        logout();
        router.replace('/login');
    };

    const getExpiryBadge = (status: string) => {
        switch (status) {
            case 'EXPIRED':
                return <span className="badge badge-danger">Expired</span>;
            case 'EXPIRING_SOON':
                return <span className="badge badge-warning">Expiring</span>;
            default:
                return <span className="badge badge-safe">Safe</span>;
        }
    };

    if (authLoading || !token) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            {/* Header */}
            <header className="bg-primary-500 text-white px-4 py-4 pb-16">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-primary-100 text-sm">Welcome back,</p>
                        <h1 className="text-xl font-semibold">{user?.name || 'User'}</h1>
                    </div>
                    <div className="flex items-center gap-3">
                        <Link href="/alerts" className="relative p-2">
                            <Bell className="w-6 h-6" />
                            {alerts.length > 0 && (
                                <span className="absolute top-0 right-0 w-5 h-5 bg-red-500 rounded-full text-xs flex items-center justify-center">
                                    {alerts.length}
                                </span>
                            )}
                        </Link>
                        <button onClick={() => setShowMenu(!showMenu)} className="p-2">
                            <Menu className="w-6 h-6" />
                        </button>
                    </div>
                </div>
            </header>

            {/* Stats Cards */}
            <div className="px-4 -mt-12">
                <div className="grid grid-cols-2 gap-3">
                    <div className="card">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                                <Package className="w-5 h-5 text-primary-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-gray-900">{stats.totalMedicines}</p>
                                <p className="text-xs text-gray-500">Total Medicines</p>
                            </div>
                        </div>
                    </div>

                    <div className="card">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center">
                                <AlertTriangle className="w-5 h-5 text-yellow-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-gray-900">{stats.expiringCount}</p>
                                <p className="text-xs text-gray-500">Expiring Soon</p>
                            </div>
                        </div>
                    </div>

                    <div className="card">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                                <Package className="w-5 h-5 text-red-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-gray-900">{stats.lowStockCount}</p>
                                <p className="text-xs text-gray-500">Low Stock</p>
                            </div>
                        </div>
                    </div>

                    <div className="card">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                                <TrendingUp className="w-5 h-5 text-green-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-gray-900">₹{stats.monthlySavings.toLocaleString('en-IN')}</p>
                                <p className="text-xs text-gray-500">Saved</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="px-4 mt-6">
                <div className="flex gap-3">
                    <Link href="/medicines/add" className="btn btn-primary flex-1 py-3">
                        <Plus className="w-5 h-5 mr-2" />
                        Add Medicine
                    </Link>
                    <Link href="/medicines" className="btn btn-secondary flex-1 py-3">
                        <Search className="w-5 h-5 mr-2" />
                        Search
                    </Link>
                </div>
            </div>

            {/* Recent Medicines */}
            <div className="px-4 mt-6">
                <div className="flex items-center justify-between mb-3">
                    <h2 className="text-lg font-semibold text-gray-900">Recent Medicines</h2>
                    <Link href="/medicines" className="text-primary-600 text-sm font-medium flex items-center">
                        View All <ChevronRight className="w-4 h-4" />
                    </Link>
                </div>

                {isLoading ? (
                    <div className="card flex items-center justify-center py-8">
                        <Loader2 className="w-6 h-6 text-primary-500 animate-spin" />
                    </div>
                ) : recentMedicines.length === 0 ? (
                    <div className="card text-center py-8">
                        <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500">No medicines yet</p>
                        <Link href="/medicines/add" className="text-primary-600 font-medium mt-2 inline-block">
                            Add your first medicine
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {recentMedicines.map((medicine) => (
                            <Link
                                key={medicine.id}
                                href={`/medicines/${medicine.id}`}
                                className="card flex items-center justify-between"
                            >
                                <div>
                                    <h3 className="font-medium text-gray-900">{medicine.name}</h3>
                                    <p className="text-sm text-gray-500">Stock: {medicine.currentStock}</p>
                                </div>
                                {getExpiryBadge(medicine.expiryStatus)}
                            </Link>
                        ))}
                    </div>
                )}
            </div>

            {/* Menu Overlay */}
            {showMenu && (
                <div className="fixed inset-0 z-50">
                    <div className="absolute inset-0 bg-black/50" onClick={() => setShowMenu(false)} />
                    <div className="absolute right-0 top-0 bottom-0 w-72 bg-white shadow-xl">
                        <div className="p-4 bg-primary-500 text-white">
                            <button onClick={() => setShowMenu(false)} className="absolute top-4 right-4">
                                <X className="w-6 h-6" />
                            </button>
                            <div className="mt-8">
                                <p className="text-primary-100 text-sm">Signed in as</p>
                                <p className="font-semibold">{user?.name}</p>
                                <p className="text-sm text-primary-100">{user?.email || user?.phone}</p>
                            </div>
                        </div>
                        <nav className="p-4">
                            <Link href="/dashboard" className="block py-3 text-gray-700 font-medium border-b">
                                Dashboard
                            </Link>
                            <Link href="/medicines" className="block py-3 text-gray-700 font-medium border-b">
                                Medicines
                            </Link>
                            <Link href="/alerts" className="block py-3 text-gray-700 font-medium border-b">
                                Alerts
                            </Link>
                            <Link href="/savings" className="block py-3 text-gray-700 font-medium border-b">
                                Savings
                            </Link>
                            <button
                                onClick={handleLogout}
                                className="flex items-center gap-2 py-3 text-red-600 font-medium mt-4"
                            >
                                <LogOut className="w-5 h-5" />
                                Sign Out
                            </button>
                        </nav>
                    </div>
                </div>
            )}

            {/* Bottom Navigation */}
            <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-3">
                <div className="flex items-center justify-around">
                    <Link href="/dashboard" className="flex flex-col items-center text-primary-600">
                        <Package className="w-6 h-6" />
                        <span className="text-xs mt-1">Home</span>
                    </Link>
                    <Link href="/medicines" className="flex flex-col items-center text-gray-400">
                        <Search className="w-6 h-6" />
                        <span className="text-xs mt-1">Search</span>
                    </Link>
                    <Link href="/medicines/add" className="flex flex-col items-center">
                        <div className="w-12 h-12 -mt-6 bg-primary-500 rounded-full flex items-center justify-center shadow-lg">
                            <Plus className="w-6 h-6 text-white" />
                        </div>
                    </Link>
                    <Link href="/alerts" className="flex flex-col items-center text-gray-400">
                        <Bell className="w-6 h-6" />
                        <span className="text-xs mt-1">Alerts</span>
                    </Link>
                    <Link href="/savings" className="flex flex-col items-center text-gray-400">
                        <TrendingUp className="w-6 h-6" />
                        <span className="text-xs mt-1">Savings</span>
                    </Link>
                </div>
            </nav>
        </div>
    );
}
