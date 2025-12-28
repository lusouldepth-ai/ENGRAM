'use client';

import { useState, Suspense, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Logo } from '@/components/ui/Logo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Check, X, Mail, Lock, Eye, EyeOff } from 'lucide-react';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

interface PasswordRequirement {
    label: string;
    test: (password: string) => boolean;
}

const passwordRequirements: PasswordRequirement[] = [
    { label: 'At least 8 characters', test: (p) => p.length >= 8 },
    { label: 'Contains uppercase letter', test: (p) => /[A-Z]/.test(p) },
    { label: 'Contains lowercase letter', test: (p) => /[a-z]/.test(p) },
    { label: 'Contains number', test: (p) => /[0-9]/.test(p) },
];

function RegisterPageContent() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [resending, setResending] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [message, setMessage] = useState<string | null>(null);
    const [registeredEmail, setRegisteredEmail] = useState<string>('');
    const router = useRouter();

    // Password validation
    const passwordValidation = useMemo(() => {
        return passwordRequirements.map(req => ({
            ...req,
            passed: req.test(password),
        }));
    }, [password]);

    const isPasswordValid = passwordValidation.every(req => req.passed);
    const passwordsMatch = password === confirmPassword && confirmPassword.length > 0;

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        // Client-side validation
        if (!isPasswordValid) {
            setError('Please meet all password requirements');
            return;
        }

        if (!passwordsMatch) {
            setError('Passwords do not match');
            return;
        }

        setLoading(true);
        setMessage(null);

        const supabase = createClient();

        try {
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    emailRedirectTo: `${window.location.origin}/auth/callback`,
                },
            });

            if (error) {
                throw error;
            }

            if (data.user && data.user.identities && data.user.identities.length === 0) {
                setError("This email is already registered. Please sign in.");
                return;
            }

            // If session exists immediately, user is logged in (auto-confirm enabled)
            if (data.session) {
                router.push('/onboarding');
                return;
            }

            // Success - email verification required
            setRegisteredEmail(email);
            setMessage("We've sent a verification link to your email. Please check your inbox and spam folder.");
        } catch (err: any) {
            console.error("Registration error:", err);
            setError(err.message || "Failed to sign up");
        } finally {
            setLoading(false);
        }
    };

    const handleResendEmail = async () => {
        if (!registeredEmail) return;

        setResending(true);
        const supabase = createClient();

        try {
            const { error } = await supabase.auth.resend({
                type: 'signup',
                email: registeredEmail,
                options: {
                    emailRedirectTo: `${window.location.origin}/auth/callback`,
                },
            });

            if (error) throw error;
            setMessage("Verification email resent! Please check your inbox.");
        } catch (err: any) {
            setError(err.message || "Failed to resend email");
        } finally {
            setResending(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-braun-bg p-4">
            <div className="w-full max-w-md space-y-6">
                {/* Header */}
                <div className="flex flex-col items-center space-y-3">
                    <Logo className="w-14 h-14" />
                    <div className="text-center">
                        <h1 className="text-2xl font-bold tracking-tight text-braun-text">
                            Create your account
                        </h1>
                        <p className="text-sm text-gray-500 mt-1">
                            Start your vocabulary learning journey
                        </p>
                    </div>
                </div>

                {/* Card */}
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200">
                    {message ? (
                        /* Success State */
                        <div className="text-center space-y-6 animate-fade-in">
                            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                                <Mail className="w-8 h-8 text-green-600" />
                            </div>
                            <div>
                                <h2 className="text-lg font-semibold text-braun-text mb-2">
                                    Check your email
                                </h2>
                                <p className="text-sm text-gray-600">
                                    {message}
                                </p>
                                <p className="text-xs text-gray-400 mt-2">
                                    Sent to: {registeredEmail}
                                </p>
                            </div>
                            <div className="space-y-3">
                                <Button
                                    onClick={handleResendEmail}
                                    disabled={resending}
                                    variant="outline"
                                    className="w-full"
                                >
                                    {resending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Resend verification email
                                </Button>
                                <Button
                                    onClick={() => router.push('/login')}
                                    className="w-full bg-braun-text hover:bg-black text-white"
                                >
                                    Go to Sign In
                                </Button>
                            </div>
                        </div>
                    ) : (
                        /* Registration Form */
                        <form onSubmit={handleRegister} className="space-y-5">
                            {/* Email Field */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700" htmlFor="email">
                                    Email address
                                </label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <Input
                                        id="email"
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        className="pl-10 bg-gray-50"
                                        placeholder="name@example.com"
                                    />
                                </div>
                            </div>

                            {/* Password Field */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700" htmlFor="password">
                                    Password
                                </label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <Input
                                        id="password"
                                        type={showPassword ? 'text' : 'password'}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        className="pl-10 pr-10 bg-gray-50"
                                        placeholder="Create a strong password"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                    >
                                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>

                                {/* Password Requirements */}
                                {password.length > 0 && (
                                    <div className="mt-2 p-3 bg-gray-50 rounded-lg space-y-1">
                                        {passwordValidation.map((req, i) => (
                                            <div key={i} className="flex items-center gap-2 text-xs">
                                                {req.passed ? (
                                                    <Check className="w-3 h-3 text-green-500" />
                                                ) : (
                                                    <X className="w-3 h-3 text-gray-300" />
                                                )}
                                                <span className={req.passed ? 'text-green-600' : 'text-gray-400'}>
                                                    {req.label}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Confirm Password Field */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700" htmlFor="confirmPassword">
                                    Confirm password
                                </label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <Input
                                        id="confirmPassword"
                                        type={showConfirmPassword ? 'text' : 'password'}
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        required
                                        className="pl-10 pr-10 bg-gray-50"
                                        placeholder="Confirm your password"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                    >
                                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                                {confirmPassword.length > 0 && (
                                    <div className="flex items-center gap-2 text-xs mt-1">
                                        {passwordsMatch ? (
                                            <>
                                                <Check className="w-3 h-3 text-green-500" />
                                                <span className="text-green-600">Passwords match</span>
                                            </>
                                        ) : (
                                            <>
                                                <X className="w-3 h-3 text-red-500" />
                                                <span className="text-red-500">Passwords do not match</span>
                                            </>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Error Message */}
                            {error && (
                                <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">
                                    {error}
                                </div>
                            )}

                            {/* Submit Button */}
                            <Button
                                type="submit"
                                disabled={loading || !isPasswordValid || !passwordsMatch}
                                className="w-full bg-braun-text hover:bg-black text-white rounded-full h-11 disabled:opacity-50"
                            >
                                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Create Account
                            </Button>

                            {/* Terms */}
                            <p className="text-xs text-center text-gray-400">
                                By creating an account, you agree to our{' '}
                                <Link href="/terms" className="underline hover:text-gray-600">Terms</Link>
                                {' '}and{' '}
                                <Link href="/privacy" className="underline hover:text-gray-600">Privacy Policy</Link>
                            </p>
                        </form>
                    )}
                </div>

                {/* Footer Link */}
                {!message && (
                    <p className="text-center text-sm text-gray-500">
                        Already have an account?{' '}
                        <Link
                            href="/login"
                            className="font-medium text-braun-accent hover:underline"
                        >
                            Sign in
                        </Link>
                    </p>
                )}
            </div>
        </div>
    );
}

export default function RegisterPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-braun-bg">
                <Loader2 className="h-8 w-8 animate-spin text-braun-accent" />
            </div>
        }>
            <RegisterPageContent />
        </Suspense>
    );
}

