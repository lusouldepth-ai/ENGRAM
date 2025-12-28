'use client';

import { useState, Suspense } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { Link } from 'next/link'; // Import Link
import { Logo } from '@/components/ui/Logo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2 } from 'lucide-react';

// Ensure fully dynamic
export const dynamic = 'force-dynamic';

function LoginPageContent() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();

    try {
      console.log("Attempting login...");
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        console.error("Supabase login error:", authError);
        throw authError; // Re-throw to catch below
      }

      console.log("Login successful, user:", authData.user?.id);

      if (authData.user) {
        try {
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('onboarding_completed')
            .eq('id', authData.user.id)
            .single();

          if (profileError) {
            console.warn("Could not fetch profile, defaulting to onboarding:", profileError);
            // If profile fetch fails, safe bet is dashboard or onboarding. 
            // Let's go to dashboard as fallback if they logged in, or onboarding?
            // Defaulting to onboarding is safer for new users, but dashboard better for existing if DB glitch.
            // Let's stick to existing logic but handle error gracefully.
            router.push('/dashboard');
          } else {
            console.log("Profile loaded, onboarding_completed:", profile?.onboarding_completed);
            router.push(profile?.onboarding_completed ? '/dashboard' : '/onboarding');
          }
          router.refresh();
        } catch (innerErr) {
          console.error("Profile check failed:", innerErr);
          router.push('/dashboard'); // Fallback
        }
      }
    } catch (err: any) {
      console.error("Login failed:", err);
      setError(err.message || "Failed to sign in");
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
            Welcome back
          </h2>
        </div>

        <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200">
          <form onSubmit={handleLogin} className="space-y-6">
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
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700" htmlFor="password">Password</label>
                {/* Optional: Add Forgot Password link here later */}
              </div>
              <Input
                id="password"
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
              Sign In
            </Button>
          </form>

          <div className="mt-6 text-center">
            <a
              href="/register"
              className="text-sm text-gray-500 hover:text-braun-accent transition-colors"
              onClick={(e) => {
                e.preventDefault();
                router.push('/register');
              }}
            >
              Don&apos;t have an account? Sign up
            </a>
          </div>
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
