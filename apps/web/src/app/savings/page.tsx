'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth';
import { api } from '@/lib/api';
import {
    ArrowLeft,
    TrendingUp,
    Loader2,
    IndianRupee,
    Calendar,
    Package,
} from 'lucide-react';

interface MonthlySaving {
    id: string;
    monthYear: string;
    expirySavings: number;
    overstockSavings: number;
    totalSavings: number;
    medicinesSaved: number;
}

export default function SavingsPage() {
    const router = useRouter();
    const { token } = useAuthStore();

    const [savings, setSavings] = useState<MonthlySaving[]>([]);
    const [totalSavings, setTotalSavings] = useState(0);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!token) {
            router.replace('/login');
            return;
        }
        loadSavings();
    }, [token]);

    const loadSavings = async () => {
        setIsLoading(true);
        try {
            const res = await api.get<{ monthlySavings: MonthlySaving[]; totalSavings: number }>('/savings/monthly?months=12');
            if (res.success && res.data) {
                setSavings(res.data.monthlySavings);
                setTotalSavings(res.data.totalSavings);
            }
        } catch (error) {
            console.error('Failed to load savings:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const formatMonth = (monthYear: string) => {
        const [year, month] = monthYear.split('-');
        const date = new Date(parseInt(year), parseInt(month) - 1);
        return date.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
    };

    const formatCurrency = (amount: number) => {
        return `₹${amount.toLocaleString('en-IN')}`;
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-6">
            {/* Header */}
            <header className="bg-gradient-to-br from-green-500 to-green-600 text-white">
                <div className="px-4 py-3 flex items-center gap-3">
                    <button onClick={() => router.back()} className="p-2 -ml-2">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <h1 className="text-lg font-semibold">Your Savings</h1>
                </div>

                {/* Total Savings Card */}
                <div className="px-4 pb-6">
                    <div className="bg-white/20 backdrop-blur rounded-xl p-6 text-center">
                        <p className="text-green-100 text-sm">Total Savings</p>
                        <p className="text-4xl font-bold mt-1">{formatCurrency(totalSavings)}</p>
                        <p className="text-green-100 text-sm mt-2">
                            By preventing medicine expiry
                        </p>
                    </div>
                </div>
            </header>

            {/* How it works */}
            <div className="px-4 mt-4">
                <div className="card bg-green-50 border-green-200">
                    <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                            <TrendingUp className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                            <h3 className="font-medium text-green-900">How we calculate savings</h3>
                            <p className="text-sm text-green-700 mt-1">
                                When you sell or use medicines that were about to expire, we calculate the value you saved from going to waste.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Monthly Breakdown */}
            <div className="px-4 mt-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-3">Monthly Breakdown</h2>

                {isLoading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
                    </div>
                ) : savings.length === 0 ? (
                    <div className="text-center py-12">
                        <IndianRupee className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500">No savings recorded yet</p>
                        <p className="text-sm text-gray-400 mt-1">
                            Use your expiring medicines before they expire to start saving!
                        </p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {savings.map((saving) => (
                            <div key={saving.id} className="card">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                                            <Calendar className="w-5 h-5 text-green-600" />
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-900">
                                                {formatMonth(saving.monthYear)}
                                            </p>
                                            <p className="text-sm text-gray-500">
                                                {saving.medicinesSaved} medicine{saving.medicinesSaved !== 1 ? 's' : ''} saved
                                            </p>
                                        </div>
                                    </div>
                                    <p className="text-lg font-bold text-green-600">
                                        {formatCurrency(Number(saving.totalSavings))}
                                    </p>
                                </div>

                                {(Number(saving.expirySavings) > 0 || Number(saving.overstockSavings) > 0) && (
                                    <div className="mt-3 pt-3 border-t border-gray-100 flex gap-4">
                                        {Number(saving.expirySavings) > 0 && (
                                            <div className="flex items-center gap-1 text-sm text-gray-500">
                                                <Package className="w-4 h-4" />
                                                <span>Expiry: {formatCurrency(Number(saving.expirySavings))}</span>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
