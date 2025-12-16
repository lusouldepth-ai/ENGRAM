"use client";

import { Button } from "@/components/ui/button";
import { Check, Lock, Star, Zap, ArrowLeft, Crown } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
export const dynamic = 'force-dynamic';
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Navbar } from "@/components/landing/Navbar";

import { useLanguage } from "@/lib/contexts/LanguageContext";

export default function PricingPage() {
  const router = useRouter();
  const supabase = createClient();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState(false);
  const { t } = useLanguage();

  useEffect(() => {
    async function getData() {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (user) {
        let { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        // If profile doesn't exist, create one
        if (!data) {
          console.log("⚠️ [Pricing] Profile missing, creating one...");
          await supabase
            .from('profiles')
            .insert({
              id: user.id,
              email: user.email,
              tier: 'free',
              accent_preference: 'US'
            });

          const { data: newProfile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();
          data = newProfile;
        }
        setProfile(data);
      }
      setLoading(false);
    }
    getData();
  }, [supabase]);

  const handleUpgrade = async () => {
    if (!user) {
      router.push('/login');
      return;
    }

    setUpgrading(true);

    // Use upsert to ensure profile exists and update tier
    const { error } = await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        email: user.email,
        tier: 'pro'
      }, {
        onConflict: 'id'
      });

    if (error) {
      alert("Upgrade failed: " + error.message);
    } else {
      // Refresh data
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      setProfile(data);
      alert("Welcome to Pro! 🚀");
      router.push("/dashboard");
      router.refresh();
    }
    setUpgrading(false);
  };

  const handleGoBack = () => {
    // Try to go back, or fallback to dashboard
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push('/dashboard');
    }
  };

  const isPro = profile?.tier === 'pro';

  return (
    <div className="min-h-screen bg-braun-bg text-[#1A1A1A] font-sans selection:bg-[#EA580C] selection:text-white flex flex-col">
      <Navbar user={user} />

      <main className="flex-1 flex flex-col items-center p-6 md:p-12">
        {/* Back Button */}
        <div className="w-full max-w-5xl mb-4">
          <Button
            variant="ghost"
            onClick={handleGoBack}
            className="text-gray-500 hover:text-gray-700 gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            返回
          </Button>
        </div>

        {/* Pro User Banner */}
        {isPro && !loading && (
          <div className="w-full max-w-5xl mb-8 p-6 bg-gradient-to-r from-[#EA580C]/10 to-orange-100 rounded-2xl border border-[#EA580C]/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-[#EA580C] rounded-full flex items-center justify-center">
                  <Crown className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[#1A1A1A]">你已经是 Pro 会员了！</h3>
                  <p className="text-gray-600 text-sm">尽情享受所有高级功能吧</p>
                </div>
              </div>
              <Button
                onClick={() => router.push('/dashboard')}
                className="bg-[#EA580C] hover:bg-[#C2410C] text-white rounded-full px-6"
              >
                开始学习
              </Button>
            </div>
          </div>
        )}

        <div className="w-full max-w-5xl text-center mb-12 pt-6 space-y-4">
          <p className="text-xs tracking-[0.4em] uppercase text-gray-400">{t('pricing.cadence')}</p>
          <h1 className="text-4xl md:text-5xl font-semibold tracking-tight text-[#1A1A1A]">
            {t('pricing.title')}
          </h1>
          <p className="text-base md:text-lg text-gray-500 max-w-3xl mx-auto">
            {t('pricing.subtitle')}
          </p>
        </div>

        <div className="w-full max-w-5xl grid gap-6 md:grid-cols-2 items-stretch">
          {/* Starter Plan */}
          <div className="relative p-8 rounded-2xl bg-white border border-stone-200 shadow-sm flex flex-col h-full">
            <div className="mb-6">
              <h3 className="text-xl font-bold mb-2">{t('pricing.starter')}</h3>
              <div className="text-3xl font-bold">$0 <span className="text-sm font-normal text-gray-500">/ month</span></div>
              <p className="text-gray-500 text-sm mt-2">{t('pricing.perfect')}</p>
            </div>

            <ul className="space-y-4 mb-8 flex-1">
              <FeatureItem>5 AI Cards / Day</FeatureItem>
              <FeatureItem>Basic Review Modes</FeatureItem>
              <FeatureItem>Standard Audio</FeatureItem>
              <FeatureItem>Mobile Access</FeatureItem>
            </ul>

            <Button
              className="w-full rounded-full py-6 text-base font-medium bg-stone-100 text-stone-900 hover:bg-stone-200 border border-stone-200"
              disabled={true}
            >
              {isPro ? t('pricing.downgrade') : t('pricing.current')}
            </Button>
          </div>

          {/* Pro Plan */}
          <div className="relative p-8 rounded-2xl bg-white border-2 border-[#EA580C] shadow-xl flex flex-col h-full">
            <div className="absolute top-0 right-0 bg-[#EA580C] text-white text-xs font-bold px-3 py-1 rounded-bl-xl rounded-tr-lg tracking-wide">
              RECOMMENDED
            </div>

            <div className="mb-6">
              <h3 className="text-xl font-bold mb-2 flex items-center gap-2">
                {t('pricing.pro')} <Zap className="w-4 h-4 fill-[#EA580C] text-[#EA580C]" />
              </h3>
              <div className="text-3xl font-bold">$9.90 <span className="text-sm font-normal text-gray-500">/ month</span></div>
              <p className="text-gray-500 text-sm mt-2">{t('pricing.mastery')}</p>
            </div>

            <ul className="space-y-4 mb-8 flex-1">
              <FeatureItem highlight>Infinite AI Cards</FeatureItem>
              <FeatureItem highlight>Shadow Mode (Speaking)</FeatureItem>
              <FeatureItem highlight>Smart Shuffle Examples</FeatureItem>
              <FeatureItem highlight>Advanced Analytics</FeatureItem>
              <FeatureItem highlight>Priority Support</FeatureItem>
            </ul>

            <Button
              onClick={handleUpgrade}
              disabled={isPro || upgrading}
              className="w-full rounded-full py-6 text-base font-bold bg-[#EA580C] hover:bg-[#C2410C] text-white shadow-md transition-all hover:shadow-lg"
            >
              {upgrading ? "Upgrading..." : (isPro ? t('pricing.active') : t('pricing.upgrade'))}
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}

function FeatureItem({ children, highlight }: { children: React.ReactNode, highlight?: boolean }) {
  return (
    <li className="flex items-center gap-3 text-sm">
      <div className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center ${highlight ? 'bg-[#EA580C]/10' : 'bg-stone-100'}`}>
        <Check className={`w-3 h-3 ${highlight ? 'text-[#EA580C]' : 'text-gray-500'}`} />
      </div>
      <span className={highlight ? 'font-medium text-[#1A1A1A]' : 'text-gray-600'}>
        {children}
      </span>
    </li>
  )
}
