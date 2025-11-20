import { CommandBar } from "@/components/creator/CommandBar";
import ReviewSection from "@/components/reviewer/ReviewSection";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Navbar } from "@/components/landing/Navbar";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("tier, accent_preference, shadow_rate")
    .eq("id", user.id)
    .single();

  return (
    <main className="min-h-screen bg-[#F4F4F0] text-[#1A1A1A] font-sans selection:bg-[#EA580C] selection:text-white flex flex-col">
      <Navbar user={user} />

      <div className="flex-1 w-full max-w-5xl mx-auto p-6 md:p-12 flex flex-col gap-12">
        
        {/* Section 1: Input / Creator */}
        <section className="w-full animate-fade-in">
          <div className="mb-6 flex items-center justify-between px-2">
             <h2 className="text-xl font-medium text-[#1A1A1A] tracking-tight">New Memory</h2>
             <span className="text-xs text-gray-400 uppercase tracking-widest">Input</span>
          </div>
          
          <div className="bg-white rounded-2xl border border-[#E5E5E5] shadow-sm hover:shadow-md transition-shadow duration-500 overflow-hidden">
             {/* CommandBar has its own internal padding, but we want it to feel like part of this container */}
             <div className="-my-4"> 
                <CommandBar />
             </div>
          </div>
        </section>

        {/* Section 2: Reviewer */}
        <section className="w-full flex-1 flex flex-col min-h-[500px] animate-fade-in animation-delay-200">
           <div className="mb-6 flex items-center justify-between px-2">
             <h2 className="text-xl font-medium text-[#1A1A1A] tracking-tight">Daily Review</h2>
             <span className="text-xs text-gray-400 uppercase tracking-widest">SRS Queue</span>
          </div>

          <div className="flex-1 bg-[#FAFAF9] rounded-3xl border border-[#E5E5E5] p-8 flex items-center justify-center relative overflow-hidden shadow-inner">
             {/* Decorative Background Elements */}
             <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#EA580C]/20 to-transparent opacity-50"></div>
             
             <div className="relative z-10 w-full">
                <ReviewSection profile={profile || undefined} />
             </div>
          </div>
        </section>

      </div>
    </main>
  );
}
