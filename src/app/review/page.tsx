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

  // Try to get profile
  let { data: profile } = await supabase
    .from("profiles")
    .select("tier, accent_preference, shadow_rate")
    .eq("id", user.id)
    .single();

  // If profile doesn't exist, create one with defaults
  if (!profile) {
    console.log("⚠️ [Review] Profile missing, creating one...");
    const { error: insertError } = await supabase
      .from('profiles')
      .insert({ 
        id: user.id, 
        email: user.email,
        tier: 'free',
        accent_preference: 'US'
      });
    
    if (!insertError) {
      const { data: newProfile } = await supabase
        .from("profiles")
        .select("tier, accent_preference, shadow_rate")
        .eq("id", user.id)
        .single();
      profile = newProfile;
    }
  }

  return (
    <main className="min-h-screen bg-[#F4F4F0] text-[#1A1A1A] font-sans selection:bg-[#EA580C] selection:text-white flex flex-col">
      <Navbar user={user} />

      <div className="flex-1 w-full max-w-5xl mx-auto p-6 md:p-12 flex flex-col items-center justify-center">
        <ReviewSection profile={(profile as any) || undefined} />
      </div>
    </main>
  );
}

