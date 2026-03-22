'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/stores/auth';
import { Eye, EyeOff, Loader2, Phone, Mail } from 'lucide-react';

export default function LoginPage() {
    const router = useRouter();
    const { login, isLoading, error, clearError } = useAuthStore();

    const [usePhone, setUsePhone] = useState(true);
    const [formData, setFormData] = useState({
        email: '',
        phone: '',
        password: '',
    });
    const [showPassword, setShowPassword] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        clearError();

        const credentials = usePhone
            ? { phone: formData.phone, password: formData.password }
            : { email: formData.email, password: formData.password };

        const success = await login(credentials);
        if (success) {
            router.push('/dashboard');
        }
    };

    return (
        <div className="min-h-screen flex flex-col bg-gradient-to-br from-primary-500 to-primary-700">
            {/* Header */}
            <div className="pt-12 pb-8 text-center">
                <img src="/logo.png" alt="MediNow" className="w-20 h-20 mx-auto mb-3" />
                <h1 className="text-2xl font-bold text-white">Welcome Back</h1>
                <p className="text-primary-100 mt-1">Sign in to MediNow</p>
            </div>

            {/* Form Card */}
            <div className="flex-1 bg-white rounded-t-3xl px-6 pt-8 pb-6">
                {/* Toggle */}
                <div className="flex bg-gray-100 rounded-lg p-1 mb-6">
                    <button
                        type="button"
                        onClick={() => setUsePhone(true)}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-md text-sm font-medium transition-all ${usePhone ? 'bg-white shadow text-primary-600' : 'text-gray-500'
                            }`}
                    >
                        <Phone className="w-4 h-4" />
                        Phone
                    </button>
                    <button
                        type="button"
                        onClick={() => setUsePhone(false)}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-md text-sm font-medium transition-all ${!usePhone ? 'bg-white shadow text-primary-600' : 'text-gray-500'
                            }`}
                    >
                        <Mail className="w-4 h-4" />
                        Email
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {usePhone ? (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                Phone Number
                            </label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">+91</span>
                                <input
                                    type="tel"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    className="input pl-14"
                                    placeholder="9876543210"
                                    maxLength={10}
                                    required
                                />
                            </div>
                        </div>
                    ) : (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                Email Address
                            </label>
                            <input
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                className="input"
                                placeholder="you@example.com"
                                required
                            />
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                            Password
                        </label>
                        <div className="relative">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                className="input pr-12"
                                placeholder="••••••••"
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"
                            >
                                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </button>
                        </div>
                    </div>

                    {error && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-sm text-red-600">{error}</p>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="btn btn-primary w-full py-3"
                    >
                        {isLoading ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            'Sign In'
                        )}
                    </button>
                </form>

                <div className="mt-6 text-center">
                    <p className="text-gray-600">
                        Don't have an account?{' '}
                        <Link href="/signup" className="text-primary-600 font-medium">
                            Sign Up
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
