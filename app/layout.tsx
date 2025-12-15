import type { Metadata } from "next";
import "./globals.css";
import { cn } from "@/lib/utils";
import { LanguageProvider } from "@/lib/contexts/LanguageContext";
import { GlobalWordMenu } from "@/components/layout/GlobalWordMenu";

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
      <body className={cn("font-sans antialiased")}>
        <LanguageProvider>
          {children}
          <GlobalWordMenu />
        </LanguageProvider>
      </body>
    </html>
  );
}
