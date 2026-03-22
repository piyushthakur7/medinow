'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/stores/auth';
import { api } from '@/lib/api';
import {
    Search,
    Plus,
    Package,
    ArrowLeft,
    Filter,
    Loader2,
    ChevronRight,
} from 'lucide-react';

interface Medicine {
    id: string;
    name: string;
    currentStock: number;
    expiryDate: string;
    expiryStatus: string;
    unitPrice?: number;
}

export default function MedicinesPage() {
    const router = useRouter();
    const { token } = useAuthStore();

    const [medicines, setMedicines] = useState<Medicine[]>([]);
    const [filteredMedicines, setFilteredMedicines] = useState<Medicine[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filter, setFilter] = useState<'all' | 'expiring' | 'low_stock'>('all');

    useEffect(() => {
        if (!token) {
            router.replace('/login');
            return;
        }
        loadMedicines();
    }, [token]);

    useEffect(() => {
        filterMedicines();
    }, [medicines, searchQuery, filter]);

    const loadMedicines = async () => {
        setIsLoading(true);
        try {
            const res = await api.get<{ medicines: Medicine[] }>('/medicines');
            if (res.success && res.data) {
                setMedicines(res.data.medicines);
            }
        } catch (error) {
            console.error('Failed to load medicines:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const filterMedicines = () => {
        let result = medicines;

        // Search filter
        if (searchQuery) {
            result = result.filter(m =>
                m.name.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        // Status filter
        if (filter === 'expiring') {
            result = result.filter(m =>
                m.expiryStatus === 'EXPIRING_SOON' || m.expiryStatus === 'EXPIRED'
            );
        } else if (filter === 'low_stock') {
            result = result.filter(m => m.currentStock <= 10);
        }

        setFilteredMedicines(result);
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

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        });
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-6">
            {/* Header */}
            <header className="bg-white border-b sticky top-0 z-10">
                <div className="px-4 py-3 flex items-center gap-3">
                    <button onClick={() => router.back()} className="p-2 -ml-2">
                        <ArrowLeft className="w-5 h-5 text-gray-600" />
                    </button>
                    <h1 className="text-lg font-semibold text-gray-900 flex-1">Medicines</h1>
                    <Link href="/medicines/add" className="p-2 text-primary-600">
                        <Plus className="w-6 h-6" />
                    </Link>
                </div>

                {/* Search */}
                <div className="px-4 pb-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="input pl-10"
                            placeholder="Search medicines..."
                        />
                    </div>
                </div>

                {/* Filter Tabs */}
                <div className="px-4 pb-3 flex gap-2">
                    {[
                        { key: 'all', label: 'All' },
                        { key: 'expiring', label: 'Expiring' },
                        { key: 'low_stock', label: 'Low Stock' },
                    ].map((f) => (
                        <button
                            key={f.key}
                            onClick={() => setFilter(f.key as any)}
                            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${filter === f.key
                                    ? 'bg-primary-500 text-white'
                                    : 'bg-gray-100 text-gray-600'
                                }`}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>
            </header>

            {/* Content */}
            <div className="px-4 mt-4">
                {isLoading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
                    </div>
                ) : filteredMedicines.length === 0 ? (
                    <div className="text-center py-12">
                        <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500 mb-4">
                            {searchQuery || filter !== 'all'
                                ? 'No medicines match your search'
                                : 'No medicines added yet'}
                        </p>
                        <Link href="/medicines/add" className="btn btn-primary">
                            <Plus className="w-5 h-5 mr-2" />
                            Add Medicine
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {filteredMedicines.map((medicine) => (
                            <Link
                                key={medicine.id}
                                href={`/medicines/${medicine.id}`}
                                className="card flex items-center gap-4"
                            >
                                <div className="flex-1">
                                    <h3 className="font-medium text-gray-900">{medicine.name}</h3>
                                    <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                                        <span>Stock: {medicine.currentStock}</span>
                                        <span>•</span>
                                        <span>Exp: {formatDate(medicine.expiryDate)}</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    {getExpiryBadge(medicine.expiryStatus)}
                                    <ChevronRight className="w-5 h-5 text-gray-400" />
                                </div>
                            </Link>
                        ))}
                    </div>
                )}

                {filteredMedicines.length > 0 && (
                    <p className="text-center text-sm text-gray-500 mt-4">
                        Showing {filteredMedicines.length} medicine{filteredMedicines.length !== 1 ? 's' : ''}
                    </p>
                )}
            </div>
        </div>
    );
}
