'use client';

import { useState, useEffect, Suspense } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter, useSearchParams } from 'next/navigation';
import { Logo } from '@/components/ui/Logo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2 } from 'lucide-react';

// 确保页面完全动态，不在构建时预渲染
export const dynamic = 'force-dynamic';

function LoginPageContent() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [message, setMessage] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (searchParams?.get('mode') === 'signup') {
      setMode('signup');
    }
  }, [searchParams]);

  const handleAuth = async (e: React.FormEvent) => {
    // 延迟创建 Supabase 客户端，避免构建时访问
    const supabase = createClient();
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      if (mode === 'signup') {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        });

        if (error) throw error;

        if (data.user && data.user.identities && data.user.identities.length === 0) {
          setError("This email is already registered. Please sign in.");
          return;
        }

        // Check if session exists (Auto-confirm disabled case)
        if (data.session) {
          router.push('/onboarding');
          return;
        }

        // Email confirmation required case
        setMessage("Success! Check your email to verify your account.");
        setLoading(false);

      } else {
        // Sign In Logic
        const { data: authData, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;

        // Check onboarding status - use the user from signIn response
        if (authData.user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('onboarding_completed')
            .eq('id', authData.user.id)
            .single();

          // Redirect based on onboarding status
          router.push(profile?.onboarding_completed ? '/dashboard' : '/onboarding');
          router.refresh();
        }
      }
    } catch (err: any) {
      setError(err.message);
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
            {mode === 'signin' ? 'Welcome back' : 'Create an account'}
          </h2>
        </div>

        <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200">
          {message ? (
            <div className="text-center space-y-4 animate-fade-in">
              <div className="p-3 bg-green-50 text-green-700 rounded-lg text-sm">
                {message}
              </div>
              <Button
                onClick={() => setMode('signin')}
                variant="outline"
                className="w-full"
              >
                Back to Sign In
              </Button>
            </div>
          ) : (
            <form onSubmit={handleAuth} className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Email</label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="bg-gray-50"
                  placeholder="name@example.com"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Password</label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="bg-gray-50"
                  placeholder="••••••••"
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
                {mode === 'signin' ? 'Sign In' : 'Sign Up'}
              </Button>
            </form>
          )}

          {!message && (
            <div className="mt-6 text-center">
              <button
                onClick={() => {
                  setMode(mode === 'signin' ? 'signup' : 'signin');
                  setError(null);
                }}
                className="text-sm text-gray-500 hover:text-braun-accent transition-colors"
              >
                {mode === 'signin'
                  ? "Don't have an account? Sign up"
                  : "Already have an account? Sign in"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-braun-bg">
        <Loader2 className="h-8 w-8 animate-spin text-braun-accent" />
      </div>
    }>
      <LoginPageContent />
    </Suspense>
  );
}
