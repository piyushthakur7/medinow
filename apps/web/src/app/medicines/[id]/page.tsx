'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuthStore } from '@/stores/auth';
import { api } from '@/lib/api';
import {
    ArrowLeft,
    Loader2,
    Package,
    Calendar,
    TrendingDown,
    TrendingUp,
    Trash2,
    Edit,
    Minus,
    Plus,
} from 'lucide-react';

interface Medicine {
    id: string;
    name: string;
    currentStock: number;
    expiryDate: string;
    expiryStatus: string;
    unitPrice?: number;
    batchNumber?: string;
    movements: {
        id: string;
        type: string;
        quantity: number;
        reason: string;
        timestamp: string;
    }[];
}

export default function MedicineDetailPage() {
    const router = useRouter();
    const params = useParams();
    const { token } = useAuthStore();

    const [medicine, setMedicine] = useState<Medicine | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [showStockModal, setShowStockModal] = useState<'in' | 'out' | null>(null);
    const [stockQuantity, setStockQuantity] = useState('');
    const [stockLoading, setStockLoading] = useState(false);

    useEffect(() => {
        if (!token) {
            router.replace('/login');
            return;
        }
        loadMedicine();
    }, [token, params.id]);

    const loadMedicine = async () => {
        setIsLoading(true);
        try {
            const res = await api.get<{ medicine: Medicine }>(`/medicines/${params.id}`);
            if (res.success && res.data) {
                setMedicine(res.data.medicine);
            }
        } catch (error) {
            console.error('Failed to load medicine:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleStockUpdate = async () => {
        if (!stockQuantity || !showStockModal || !medicine) return;

        setStockLoading(true);
        try {
            const endpoint = showStockModal === 'in' ? '/stock/in' : '/stock/out';
            const res = await api.post(endpoint, {
                medicineId: medicine.id,
                quantity: parseInt(stockQuantity),
                reason: showStockModal === 'in' ? 'ADDED' : 'SOLD',
            });

            if (res.success) {
                setShowStockModal(null);
                setStockQuantity('');
                loadMedicine();
            }
        } catch (error) {
            console.error('Stock update failed:', error);
        } finally {
            setStockLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this medicine?')) return;

        try {
            const res = await api.delete(`/medicines/${params.id}`);
            if (res.success) {
                router.push('/medicines');
            }
        } catch (error) {
            console.error('Delete failed:', error);
        }
    };

    const getExpiryBadge = (status: string) => {
        switch (status) {
            case 'EXPIRED':
                return <span className="badge badge-danger">Expired</span>;
            case 'EXPIRING_SOON':
                return <span className="badge badge-warning">Expiring Soon</span>;
            default:
                return <span className="badge badge-safe">Safe</span>;
        }
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        });
    };

    const formatTime = (dateStr: string) => {
        return new Date(dateStr).toLocaleTimeString('en-IN', {
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
            </div>
        );
    }

    if (!medicine) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">Medicine not found</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-24">
            {/* Header */}
            <header className="bg-white border-b sticky top-0 z-10">
                <div className="px-4 py-3 flex items-center gap-3">
                    <button onClick={() => router.back()} className="p-2 -ml-2">
                        <ArrowLeft className="w-5 h-5 text-gray-600" />
                    </button>
                    <h1 className="text-lg font-semibold text-gray-900 flex-1 truncate">
                        {medicine.name}
                    </h1>
                    <button onClick={handleDelete} className="p-2 text-red-500">
                        <Trash2 className="w-5 h-5" />
                    </button>
                </div>
            </header>

            {/* Medicine Info */}
            <div className="px-4 py-4">
                <div className="card">
                    <div className="flex items-start justify-between mb-4">
                        <div>
                            <h2 className="text-xl font-semibold text-gray-900">{medicine.name}</h2>
                            {medicine.batchNumber && (
                                <p className="text-sm text-gray-500 mt-1">Batch: {medicine.batchNumber}</p>
                            )}
                        </div>
                        {getExpiryBadge(medicine.expiryStatus)}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-gray-50 rounded-lg p-3">
                            <p className="text-sm text-gray-500">Current Stock</p>
                            <p className="text-2xl font-bold text-gray-900">{medicine.currentStock}</p>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-3">
                            <p className="text-sm text-gray-500">Expiry Date</p>
                            <p className="text-lg font-semibold text-gray-900">
                                {formatDate(medicine.expiryDate)}
                            </p>
                        </div>
                        {medicine.unitPrice && (
                            <div className="bg-gray-50 rounded-lg p-3 col-span-2">
                                <p className="text-sm text-gray-500">Unit Price</p>
                                <p className="text-lg font-semibold text-gray-900">
                                    ₹{Number(medicine.unitPrice).toFixed(2)}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Stock Actions */}
            <div className="px-4">
                <div className="flex gap-3">
                    <button
                        onClick={() => setShowStockModal('in')}
                        className="btn btn-secondary flex-1 py-3"
                    >
                        <Plus className="w-5 h-5 mr-2 text-green-600" />
                        Stock In
                    </button>
                    <button
                        onClick={() => setShowStockModal('out')}
                        className="btn btn-secondary flex-1 py-3"
                    >
                        <Minus className="w-5 h-5 mr-2 text-red-600" />
                        Stock Out
                    </button>
                </div>
            </div>

            {/* Recent Movements */}
            <div className="px-4 mt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Stock History</h3>
                {medicine.movements.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">No movements yet</p>
                ) : (
                    <div className="space-y-2">
                        {medicine.movements.map((movement) => (
                            <div key={movement.id} className="card flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${movement.type === 'IN' ? 'bg-green-100' : 'bg-red-100'
                                    }`}>
                                    {movement.type === 'IN' ? (
                                        <TrendingUp className="w-5 h-5 text-green-600" />
                                    ) : (
                                        <TrendingDown className="w-5 h-5 text-red-600" />
                                    )}
                                </div>
                                <div className="flex-1">
                                    <p className="font-medium text-gray-900">
                                        {movement.type === 'IN' ? '+' : '-'}{movement.quantity} units
                                    </p>
                                    <p className="text-sm text-gray-500 capitalize">
                                        {movement.reason.toLowerCase().replace('_', ' ')}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm text-gray-500">{formatDate(movement.timestamp)}</p>
                                    <p className="text-xs text-gray-400">{formatTime(movement.timestamp)}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Stock Modal */}
            {showStockModal && (
                <div className="fixed inset-0 z-50 flex items-end">
                    <div
                        className="absolute inset-0 bg-black/50"
                        onClick={() => setShowStockModal(null)}
                    />
                    <div className="relative w-full bg-white rounded-t-2xl p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">
                            {showStockModal === 'in' ? 'Add Stock' : 'Remove Stock'}
                        </h3>
                        <input
                            type="number"
                            value={stockQuantity}
                            onChange={(e) => setStockQuantity(e.target.value)}
                            className="input"
                            placeholder="Enter quantity"
                            min="1"
                            max={showStockModal === 'out' ? medicine.currentStock : undefined}
                            autoFocus
                        />
                        <div className="flex gap-3 mt-4">
                            <button
                                onClick={() => setShowStockModal(null)}
                                className="btn btn-secondary flex-1 py-3"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleStockUpdate}
                                disabled={!stockQuantity || stockLoading}
                                className="btn btn-primary flex-1 py-3"
                            >
                                {stockLoading ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    'Confirm'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
