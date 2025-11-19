import { CommandBar } from "@/components/creator/CommandBar";
import ReviewSection from "@/components/reviewer/ReviewSection";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Logo } from "@/components/ui/Logo";

export default async function DashboardPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  return (
    <main className="min-h-screen bg-braun-bg flex flex-col">
      {/* Top Section: Creator */}
      <section className="w-full border-b border-gray-200 bg-white/80 backdrop-blur-sm sticky top-0 z-50 shadow-sm">
        <div className="max-w-3xl mx-auto py-4 px-4 flex items-center gap-4">
          <Logo className="w-8 h-8 shrink-0" />
          <div className="flex-1">
             <CommandBar />
          </div>
          <div className="w-8"></div> {/* Spacer for balance */}
        </div>
      </section>

      {/* Main Section: Reviewer */}
      <section className="flex-1 flex flex-col items-center justify-start pt-12 p-4 w-full">
         <ReviewSection />
      </section>
    </main>
  );
}
