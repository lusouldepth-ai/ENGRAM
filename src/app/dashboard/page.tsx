
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { Database } from "@/lib/supabase/types";
import { redirect } from "next/navigation";
import { Navbar } from "@/components/landing/Navbar";
import { TranslatedText } from "@/components/ui/TranslatedText";
import { StudyCardSkeleton } from "@/components/reviewer/StudyCardSkeleton";
import { StreamedReviewSection } from "@/components/reviewer/StreamedReviewSection";

export const dynamic = "force-dynamic";

// Only fetch profile (fast) - cards will be streamed
async function getProfile(userId: string, userEmail: string | undefined, supabase: ReturnType<typeof createClient>) {
  let { data: profile } = await supabase
    .from("profiles")
    .select("tier, accent_preference")
    .eq("id", userId)
    .maybeSingle();

  // Fallback: use service role to read/create if RLS hides the row
  if (!profile && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    const admin = createAdminClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: adminProfile } = await admin
      .from("profiles")
      .select("tier, accent_preference")
      .eq("id", userId)
      .maybeSingle();

    profile = adminProfile || null;

    if (!profile) {
      const { data: upserted } = await admin
        .from("profiles")
        .upsert(
          { id: userId, email: userEmail, tier: 'free', accent_preference: 'US' },
          { onConflict: 'id' }
        )
        .select("tier, accent_preference")
        .maybeSingle();
      profile = upserted || null;
    }
  }

  return profile;
}

export default async function DashboardPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Quick profile fetch (non-blocking for main content)
  const profile = await getProfile(user.id, user.email, supabase);

  return (
    <main className="min-h-screen bg-[#F4F4F0] text-[#1A1A1A] font-sans selection:bg-[#EA580C] selection:text-white flex flex-col">
      <Navbar user={user} />

      {/* Refactored Proportions: max-w-5xl for a wider dashboard view */}
      <div className="flex-1 w-full max-w-5xl mx-auto p-4 md:p-8 flex flex-col gap-8">

        {/* Section: Reviewer with Streaming */}
        <section className="w-full flex-1 flex flex-col min-h-[400px]">
          <div className="mb-4 flex items-center justify-between px-2">
            <h2 className="text-lg font-medium text-[#1A1A1A] tracking-tight">
              <TranslatedText tKey="dashboard.dailyReview" defaultText="Daily Review" />
            </h2>
          </div>

          <div className="flex-1 bg-[#FAFAF9] rounded-3xl border border-[#E5E5E5] p-6 md:p-8 flex items-center justify-center relative overflow-hidden shadow-sm">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#EA580C]/20 to-transparent opacity-50"></div>
            <div className="relative z-10 w-full">
              {/* Suspense enables streaming: skeleton shows immediately, ReviewSection streams in when data is ready */}
              <Suspense fallback={<StudyCardSkeleton />}>
                <StreamedReviewSection
                  userId={user.id}
                  profile={profile}
                />
              </Suspense>
            </div>
          </div>
        </section>

      </div>
    </main>
  );
}
