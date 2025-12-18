'use client';

import Link from "next/link";
import { Logo } from "@/components/ui/Logo";
import { Button } from "@/components/ui/button";
import { UserNav } from "@/components/layout/UserNav";
import { LanguageToggle } from "@/components/layout/LanguageToggle";
import { User } from "@supabase/supabase-js";
import { useLanguage } from "@/lib/contexts/LanguageContext";

interface NavbarProps {
  user?: User | null;
}

export function Navbar({ user }: NavbarProps) {
  const { language } = useLanguage();

  // Static translations to reduce hydration dependency
  const labels = language === 'en'
    ? { learning: 'Learning', progress: 'Progress', pricing: 'Pricing', login: 'Login', start: 'Get Started' }
    : { learning: '学习中心', progress: '学习进度', pricing: '定价', login: '登录', start: '开始使用' };

  return (
    <header className="sticky top-0 z-50">
      <nav
        className="w-full px-6 py-5 md:px-12 flex justify-between items-center bg-white/40 backdrop-blur-xl backdrop-saturate-150 border-b border-white/30 shadow-[0_1px_0_rgba(255,255,255,0.5)_inset,0_4px_24px_rgba(0,0,0,0.04)]"
        aria-label="Main navigation"
      >
        <Link href="/" className="flex items-center gap-3 select-none cursor-pointer" aria-label="ENGRAM Home">
          <Logo className="w-8 h-8" aria-hidden="true" />
          <span className="text-xl font-bold tracking-tight text-braun-text">ENGRAM</span>
        </Link>

        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-500">
          <nav className="flex items-center gap-8" aria-label="Primary">
            <Link href="/dashboard" className="hover:text-braun-text transition-colors">{labels.learning}</Link>
            <Link href="/learning-center" className="hover:text-braun-text transition-colors">{labels.progress}</Link>
            <Link href="/pricing" className="hover:text-braun-text transition-colors">{labels.pricing}</Link>
          </nav>
          <LanguageToggle />

          {user ? (
            <UserNav />
          ) : (
            <>
              <Link href="/login" className="hover:text-braun-text transition-colors">{labels.login}</Link>
              <Link href="/login?mode=signup">
                <Button
                  className="bg-braun-text text-white px-6 rounded-full hover:bg-black transition-colors"
                  aria-label={language === 'en' ? 'Sign up for ENGRAM' : '注册 ENGRAM'}
                >
                  {labels.start}
                </Button>
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
