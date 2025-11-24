import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Navbar } from "@/components/landing/Navbar";
import ReviewSection from "@/components/reviewer/ReviewSection";

export const dynamic = "force-dynamic";

export default async function ReviewPage() {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();

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

      <div className="flex-1 w-full max-w-5xl mx-auto p-6 md:p-12 flex flex-col items-center justify-center">
        <ReviewSection profile={(profile as any) || undefined} />
      </div>
    </main>
  );
}

