import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { LanguageProvider } from "@/lib/contexts/LanguageContext";
import { GlobalWordMenu } from "@/components/layout/GlobalWordMenu";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

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
      <body className={cn(inter.variable, "font-sans antialiased")}>
        <LanguageProvider>
          {children}
          <GlobalWordMenu />
        </LanguageProvider>
      </body>
    </html>
  );
}
