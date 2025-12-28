'use client';

import { useState, Suspense } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Logo } from '@/components/ui/Logo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2 } from 'lucide-react';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

function RegisterPageContent() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [message, setMessage] = useState<string | null>(null);
    const router = useRouter();

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
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

            // If session exists immediately, user is logged in (auto-confirm enabled?)
            if (data.session) {
                router.push('/onboarding');
                return;
            }

            // Success message for email confirmation
            setMessage("Success! Please check your email to verify your account.");
        } catch (err: any) {
            console.error("Registration error:", err);
            setError(err.message || "Failed to sign up");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-braun-bg p-4">
            <div className="w-full max-w-sm space-y-8">
                <div className="flex flex-col items-center space-y-4">
                    <Logo className="w-16 h-16" />
                    <h2 className="text-2xl font-bold tracking-tight text-braun-text">
                        Create an account
                    </h2>
                </div>

                <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200">
                    {message ? (
                        <div className="text-center space-y-4 animate-fade-in">
                            <div className="p-3 bg-green-50 text-green-700 rounded-lg text-sm">
                                {message}
                            </div>
                            <Button
                                onClick={() => router.push('/login')}
                                variant="outline"
                                className="w-full"
                            >
                                Go to Sign In
                            </Button>
                        </div>
                    ) : (
                        <form onSubmit={handleRegister} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700" htmlFor="email">Email</label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    className="bg-gray-50"
                                    placeholder="name@example.com"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700" htmlFor="password">Password</label>
                                <Input
                                    id="password"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    className="bg-gray-50"
                                    placeholder="••••••••"
                                    minLength={6}
                                />
                            </div>

                            {error && (
                                <div className="text-sm text-red-500 bg-red-50 p-3 rounded-lg">
                                    {error}
                                </div>
                            )}

                            <Button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-braun-text hover:bg-black text-white rounded-full h-11"
                            >
                                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Sign Up
                            </Button>
                        </form>
                    )}

                    {!message && (
                        <div className="mt-6 text-center">
                            <Link
                                href="/login"
                                className="text-sm text-gray-500 hover:text-braun-accent transition-colors"
                            >
                                Already have an account? Sign in
                            </Link>
                        </div>
                    )}
                </div>
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
