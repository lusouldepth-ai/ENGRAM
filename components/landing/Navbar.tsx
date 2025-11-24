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
  const { t } = useLanguage();

  return (
    <nav className="w-full px-6 py-6 md:px-12 flex justify-between items-center border-b border-black/5 bg-braun-bg/80 backdrop-blur-sm sticky top-0 z-50">
      <Link href="/" className="flex items-center gap-3 select-none cursor-pointer">
        <Logo className="w-8 h-8" />
        <span className="text-xl font-bold tracking-tight text-braun-text">ENGRAM</span>
      </Link>

      <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-500">
        <nav className="flex items-center gap-8">
          <Link href="/dashboard" className="hover:text-braun-text transition-colors">英语角</Link>
          <Link href="/learning-center" className="hover:text-braun-text transition-colors">学习中心</Link>
          <Link href="/pricing" className="hover:text-braun-text transition-colors">{t('nav.pricing')}</Link>
          {user && (
            <Link href="/settings" className="hover:text-braun-text transition-colors">Settings</Link>
          )}
        </nav>
        <LanguageToggle />

        {user ? (
          <UserNav />
        ) : (
          <>
            <Link href="/login" className="hover:text-braun-text transition-colors">{t('nav.login')}</Link>
            <Link href="/login?mode=signup">
              <Button className="bg-braun-text text-white px-6 rounded-full hover:bg-black transition-colors">
                {t('nav.getStarted')}
              </Button>
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}
