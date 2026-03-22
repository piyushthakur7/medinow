'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/stores/auth';
import { Eye, EyeOff, Loader2, Phone, Mail, User } from 'lucide-react';

export default function SignupPage() {
    const router = useRouter();
    const { signup, isLoading, error, clearError } = useAuthStore();

    const [usePhone, setUsePhone] = useState(true);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: '',
    });
    const [showPassword, setShowPassword] = useState(false);
    const [validationError, setValidationError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        clearError();
        setValidationError('');

        if (formData.password !== formData.confirmPassword) {
            setValidationError('Passwords do not match');
            return;
        }

        if (formData.password.length < 6) {
            setValidationError('Password must be at least 6 characters');
            return;
        }

        const data = {
            name: formData.name,
            password: formData.password,
            ...(usePhone ? { phone: formData.phone } : { email: formData.email }),
        };

        const success = await signup(data);
        if (success) {
            router.push('/dashboard');
        }
    };

    return (
        <div className="min-h-screen flex flex-col bg-gradient-to-br from-primary-500 to-primary-700">
            {/* Header */}
            <div className="pt-10 pb-6 text-center">
                <img src="/logo.png" alt="MediNow" className="w-16 h-16 mx-auto mb-2" />
                <h1 className="text-2xl font-bold text-white">Create Account</h1>
                <p className="text-primary-100 mt-1">Start managing your inventory with MediNow</p>
            </div>

            {/* Form Card */}
            <div className="flex-1 bg-white rounded-t-3xl px-6 pt-6 pb-6 overflow-y-auto">
                {/* Toggle */}
                <div className="flex bg-gray-100 rounded-lg p-1 mb-5">
                    <button
                        type="button"
                        onClick={() => setUsePhone(true)}
                        className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-all ${usePhone ? 'bg-white shadow text-primary-600' : 'text-gray-500'
                            }`}
                    >
                        <Phone className="w-4 h-4" />
                        Phone
                    </button>
                    <button
                        type="button"
                        onClick={() => setUsePhone(false)}
                        className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-all ${!usePhone ? 'bg-white shadow text-primary-600' : 'text-gray-500'
                            }`}
                    >
                        <Mail className="w-4 h-4" />
                        Email
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                            Full Name
                        </label>
                        <div className="relative">
                            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="input pl-12"
                                placeholder="Your name"
                                required
                            />
                        </div>
                    </div>

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

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                            Confirm Password
                        </label>
                        <input
                            type="password"
                            value={formData.confirmPassword}
                            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                            className="input"
                            placeholder="••••••••"
                            required
                        />
                    </div>

                    {(error || validationError) && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-sm text-red-600">{error || validationError}</p>
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
                            'Create Account'
                        )}
                    </button>
                </form>

                <div className="mt-5 text-center">
                    <p className="text-gray-600">
                        Already have an account?{' '}
                        <Link href="/login" className="text-primary-600 font-medium">
                            Sign In
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
