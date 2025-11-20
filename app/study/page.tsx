import { LiquidTimer } from "@/components/reviewer/LiquidTimer";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { X } from "lucide-react";
import Link from "next/link";

export default async function StudyPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  return (
    <main className="relative min-h-screen w-full bg-[#F4F4F0] overflow-hidden flex flex-col items-center justify-center selection:bg-[#EA580C] selection:text-white">
      
      {/* Top Bar */}
      <div className="absolute top-0 left-0 w-full p-6 flex justify-between items-start z-50 pointer-events-none">
        {/* Exit Button (Top Left) */}
        <Link href="/dashboard" className="pointer-events-auto text-gray-400 hover:text-black transition-colors">
          <X className="w-6 h-6" />
        </Link>

        {/* Liquid Timer (Top Right) */}
        <div className="pointer-events-auto">
            <LiquidTimer />
        </div>
      </div>

      {/* Content Placeholder */}
      <div className="text-center space-y-4 max-w-md px-6 animate-fade-in">
        <h1 className="text-2xl font-medium text-[#1A1A1A]">Zen Mode</h1>
        <p className="text-gray-500">
          Focus on the droplet. Breathe.
        </p>
      </div>

    </main>
  );
}

