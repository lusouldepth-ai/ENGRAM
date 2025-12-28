import { Navbar } from "@/components/landing/Navbar";
import { Hero } from "@/components/landing/Hero";
import { FeatureGrid } from "@/components/landing/FeatureGrid";
import { Footer } from "@/components/landing/Footer";
import { createClient } from "@/lib/supabase/server";
import dynamic from 'next/dynamic';

// Load SplashCursor only on landing page (heavy WebGL component)
const SplashCursor = dynamic(
  () => import('@/components/SplashCursor'),
  { ssr: false }
);

export default async function LandingPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <main className="flex min-h-screen flex-col bg-braun-bg selection:bg-braun-accent selection:text-white">
      <SplashCursor />
      <Navbar user={user} />
      <Hero />
      <FeatureGrid />
      <Footer />
    </main>
  );
}
