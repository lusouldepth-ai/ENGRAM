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
        <Link href="/#method" className="hover:text-braun-text transition-colors">{t('nav.method')}</Link>
        <Link href="/pricing" className="hover:text-braun-text transition-colors">{t('nav.pricing')}</Link>
        <Link href="/profile" className="hover:text-braun-text transition-colors">{t('nav.learning')}</Link>
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
