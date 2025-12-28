import type { Metadata } from "next";
import "./globals.css";
import { cn } from "@/lib/utils";
import { LanguageProvider } from "@/lib/contexts/LanguageContext";
// import { Analytics } from "@vercel/analytics/next";
import dynamic from 'next/dynamic';

// Lazy load heavy client components to improve initial bundle
const GlobalWordMenu = dynamic(
  () => import('@/components/layout/GlobalWordMenu').then(mod => mod.GlobalWordMenu),
  { ssr: false }
);

const SplashCursor = dynamic(
  () => import('@/components/SplashCursor'),
  { ssr: false }
);

export const metadata: Metadata = {
  title: "ENGRAM",
  description: "Carve it in your mind.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* DNS Prefetch for critical domains */}
        <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
        <link rel="dns-prefetch" href="https://fonts.gstatic.com" />
        <link rel="dns-prefetch" href={process.env.NEXT_PUBLIC_SUPABASE_URL || ''} />

        {/* Preconnect for faster font loading */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />

        {/* Preconnect to Supabase for faster API calls */}
        <link rel="preconnect" href={process.env.NEXT_PUBLIC_SUPABASE_URL || ''} crossOrigin="anonymous" />
      </head>
      <body className={cn("font-sans antialiased")}>
        <SplashCursor />
        <LanguageProvider>
          {children}
          <GlobalWordMenu />
        </LanguageProvider>
        {/* <Analytics /> */}
      </body>
    </html>
  );
}
