import { CommandBar } from "@/components/creator/CommandBar";
import ReviewSection from "@/components/reviewer/ReviewSection";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { Database } from "@/lib/supabase/types";
import { redirect } from "next/navigation";
import { Navbar } from "@/components/landing/Navbar";
import { TranslatedText } from "@/components/ui/TranslatedText";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = createClient();
  // Debug (safe): log whether service role key is set (no value logged)
  console.log("SERVICE_ROLE_KEY_SET", !!process.env.SUPABASE_SERVICE_ROLE_KEY);

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Try to get profile (maybeSingle avoids throwing on 0 rows)
  let { data: profile } = await supabase
    .from("profiles")
    .select("tier, accent_preference")
    .eq("id", user.id)
    .maybeSingle();
  console.log("PROFILE_FROM_ANON", profile);

  // Fallback: use service role to read/create if RLS hides the row
  if (!profile && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    const admin = createAdminClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: adminProfile, error: adminErr } = await admin
      .from("profiles")
      .select("tier, accent_preference")
      .eq("id", user.id)
      .maybeSingle();
    if (adminErr) {
      console.error("ADMIN_PROFILE_FETCH_ERROR", adminErr);
    }

    profile = adminProfile || null;
    console.log("PROFILE_FROM_ADMIN", profile);

    if (!profile) {
      // Upsert with service role to avoid duplicate-key conflicts
      const { data: upserted, error: upsertErr } = await admin
        .from("profiles")
        .upsert(
          { id: user.id, email: user.email, tier: 'free', accent_preference: 'US' },
          { onConflict: 'id' }
        )
        .select("tier, accent_preference")
        .maybeSingle();
      if (upsertErr) {
        console.error("ADMIN_PROFILE_UPSERT_ERROR", upsertErr);
      }
      profile = upserted || null;
      console.log("PROFILE_AFTER_ADMIN_UPSERT", profile);
    }
  }

  console.log("PROFILE_FINAL", profile);

  console.log("Dashboard Profile Fetch:", profile);


  return (
    <main className="min-h-screen bg-[#F4F4F0] text-[#1A1A1A] font-sans selection:bg-[#EA580C] selection:text-white flex flex-col">
      <Navbar user={user} />

      <div className="flex-1 w-full max-w-5xl mx-auto p-6 md:p-12 flex flex-col gap-12">

        {/* Section 1: Input / Creator */}
        <section className="w-full animate-fade-in">
          <div className="mb-6 flex items-center justify-between px-2">
            <h2 className="text-xl font-medium text-[#1A1A1A] tracking-tight"><TranslatedText tKey="dashboard.newMemory" defaultText="New Memory" /></h2>
            <span className="text-xs text-gray-400 uppercase tracking-widest"><TranslatedText tKey="dashboard.input" defaultText="Input" /></span>
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
            <h2 className="text-xl font-medium text-[#1A1A1A] tracking-tight"><TranslatedText tKey="dashboard.dailyReview" defaultText="Daily Review" /></h2>
            <span className="text-xs text-gray-400 uppercase tracking-widest"><TranslatedText tKey="dashboard.srsQueue" defaultText="SRS Queue" /></span>
          </div>

          <div className="flex-1 bg-[#FAFAF9] rounded-3xl border border-[#E5E5E5] p-8 flex items-center justify-center relative overflow-hidden shadow-inner">
            {/* Decorative Background Elements */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#EA580C]/20 to-transparent opacity-50"></div>

            <div className="relative z-10 w-full">
              <ReviewSection profile={(profile as any) || undefined} />
            </div>
          </div>
        </section>

      </div>
    </main>
  );
}
