'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth';
import { api } from '@/lib/api';
import {
    ArrowLeft,
    Loader2,
    Calendar,
    Package,
    IndianRupee,
    Hash,
    Check,
} from 'lucide-react';

interface Suggestion {
    id: string;
    name: string;
    category?: string;
}

export default function AddMedicinePage() {
    const router = useRouter();
    const { token } = useAuthStore();

    const [formData, setFormData] = useState({
        name: '',
        quantity: '',
        expiryDate: '',
        unitPrice: '',
        batchNumber: '',
    });
    const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        if (!token) {
            router.replace('/login');
        }
    }, [token]);

    const searchMedicines = async (query: string) => {
        if (query.length < 2) {
            setSuggestions([]);
            return;
        }

        try {
            const res = await api.get<{ suggestions: Suggestion[] }>(`/medicines/search?q=${encodeURIComponent(query)}`);
            if (res.success && res.data) {
                setSuggestions(res.data.suggestions);
                setShowSuggestions(true);
            }
        } catch (error) {
            console.error('Search failed:', error);
        }
    };

    const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setFormData({ ...formData, name: value });
        searchMedicines(value);
    };

    const selectSuggestion = (suggestion: Suggestion) => {
        setFormData({ ...formData, name: suggestion.name });
        setShowSuggestions(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const res = await api.post('/medicines', {
                name: formData.name,
                quantity: parseInt(formData.quantity),
                expiryDate: formData.expiryDate,
                unitPrice: formData.unitPrice ? parseFloat(formData.unitPrice) : undefined,
                batchNumber: formData.batchNumber || undefined,
            });

            if (res.success) {
                setSuccess(true);
                setTimeout(() => {
                    router.push('/medicines');
                }, 1500);
            } else {
                setError(res.error?.message || 'Failed to add medicine');
            }
        } catch (error: any) {
            setError(error.message || 'Failed to add medicine');
        } finally {
            setIsLoading(false);
        }
    };

    // Get minimum date (today)
    const today = new Date().toISOString().split('T')[0];

    if (success) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Check className="w-8 h-8 text-green-600" />
                    </div>
                    <h2 className="text-xl font-semibold text-gray-900">Medicine Added!</h2>
                    <p className="text-gray-500 mt-1">Redirecting...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white border-b sticky top-0 z-10">
                <div className="px-4 py-3 flex items-center gap-3">
                    <button onClick={() => router.back()} className="p-2 -ml-2">
                        <ArrowLeft className="w-5 h-5 text-gray-600" />
                    </button>
                    <h1 className="text-lg font-semibold text-gray-900">Add Medicine</h1>
                </div>
            </header>

            {/* Form */}
            <form onSubmit={handleSubmit} className="px-4 py-6 space-y-5">
                {/* Medicine Name */}
                <div className="relative">
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Medicine Name *
                    </label>
                    <div className="relative">
                        <Package className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            value={formData.name}
                            onChange={handleNameChange}
                            onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                            className="input pl-10"
                            placeholder="e.g., Paracetamol 500mg"
                            required
                        />
                    </div>

                    {/* Suggestions Dropdown */}
                    {showSuggestions && suggestions.length > 0 && (
                        <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                            {suggestions.map((s) => (
                                <button
                                    key={s.id}
                                    type="button"
                                    onClick={() => selectSuggestion(s)}
                                    className="w-full px-4 py-2.5 text-left hover:bg-gray-50 border-b border-gray-100 last:border-0"
                                >
                                    <span className="font-medium text-gray-900">{s.name}</span>
                                    {s.category && (
                                        <span className="text-sm text-gray-500 ml-2">{s.category}</span>
                                    )}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Quantity */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Quantity *
                    </label>
                    <div className="relative">
                        <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="number"
                            value={formData.quantity}
                            onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                            className="input pl-10"
                            placeholder="100"
                            min="1"
                            required
                        />
                    </div>
                </div>

                {/* Expiry Date */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Expiry Date *
                    </label>
                    <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="date"
                            value={formData.expiryDate}
                            onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                            className="input pl-10"
                            min={today}
                            required
                        />
                    </div>
                </div>

                {/* Unit Price */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Unit Price (₹) <span className="text-gray-400">- for savings calculation</span>
                    </label>
                    <div className="relative">
                        <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="number"
                            value={formData.unitPrice}
                            onChange={(e) => setFormData({ ...formData, unitPrice: e.target.value })}
                            className="input pl-10"
                            placeholder="10.00"
                            step="0.01"
                            min="0"
                        />
                    </div>
                </div>

                {/* Batch Number */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Batch Number <span className="text-gray-400">(optional)</span>
                    </label>
                    <input
                        type="text"
                        value={formData.batchNumber}
                        onChange={(e) => setFormData({ ...formData, batchNumber: e.target.value })}
                        className="input"
                        placeholder="e.g., BATCH2024-001"
                    />
                </div>

                {/* Error */}
                {error && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-sm text-red-600">{error}</p>
                    </div>
                )}

                {/* Submit */}
                <button
                    type="submit"
                    disabled={isLoading}
                    className="btn btn-primary w-full py-3 mt-6"
                >
                    {isLoading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                        'Add Medicine'
                    )}
                </button>
            </form>
        </div>
    );
}
