import { createClient } from "@/lib/supabase/server";
import { Navbar } from "@/components/landing/Navbar";
import { redirect } from "next/navigation";
import { CheckCircle2, Flame, Trophy, Clock, BookOpen } from "lucide-react";
import { VocabularyList } from "@/components/profile/VocabularyList";
import { TranslatedText } from "@/components/ui/TranslatedText";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect("/login");
    }

    const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

    // Fetch stats (Mock for now, or simple count)
    const { count: totalCards } = await supabase
        .from("cards")
        .select("*", { count: 'exact', head: true })
        .eq("user_id", user.id);

    const { count: learnedCards } = await supabase
        .from("cards")
        .select("*", { count: 'exact', head: true })
        .eq("user_id", user.id)
        .gt("state", 1); // Assuming state > 1 means learned/reviewing

    const { data: allCards } = await supabase
        .from("cards")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

    return (
        <div className="min-h-screen bg-[#F4F4F0] text-[#1A1A1A] font-sans selection:bg-[#EA580C] selection:text-white flex flex-col">
            <Navbar user={user} />

            <main className="flex-1 w-full max-w-5xl mx-auto p-6 md:p-12 flex flex-col gap-12">

                {/* Header */}
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                    <div>
                        <h1 className="text-4xl font-bold tracking-tight text-[#1A1A1A] mb-2">
                            <TranslatedText tKey="profile.hello" defaultText="Hello" />, {profile?.display_name || user.email?.split('@')[0]}
                        </h1>
                        <p className="text-gray-500">
                            {profile?.tier === 'pro' ? 'Pro Member' : 'Starter Plan'} • {profile?.english_level || 'Learner'}
                        </p>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex flex-col items-end">
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider"><TranslatedText tKey="profile.currentGoal" defaultText="Current Goal" /></span>
                            <span className="text-lg font-medium text-braun-accent">{profile?.learning_goal || 'General English'}</span>
                        </div>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard
                        icon={<BookOpen className="w-5 h-5 text-braun-accent" />}
                        label={<TranslatedText tKey="profile.totalWords" defaultText="Total Words" />}
                        value={totalCards || 0}
                    />
                    <StatCard
                        icon={<CheckCircle2 className="w-5 h-5 text-green-600" />}
                        label={<TranslatedText tKey="profile.mastered" defaultText="Mastered" />}
                        value={learnedCards || 0}
                    />
                    <StatCard
                        icon={<Flame className="w-5 h-5 text-orange-500" />}
                        label={<TranslatedText tKey="profile.dayStreak" defaultText="Day Streak" />}
                        value={(profile as any)?.streak_days || 0}
                    />
                    <StatCard
                        icon={<Clock className="w-5 h-5 text-blue-500" />}
                        label={<TranslatedText tKey="profile.timeSpent" defaultText="Time Spent" />}
                        value="2.5h" // Mock for now
                    />
                </div>

                {/* Vocabulary List */}
                <VocabularyList cards={allCards || []} />

                {/* Recent Activity / Heatmap Placeholder */}
                <section className="bg-white rounded-3xl border border-[#E5E5E5] p-8 shadow-sm">
                    <div className="flex items-center justify-between mb-8">
                        <h2 className="text-xl font-bold text-[#1A1A1A]"><TranslatedText tKey="profile.learningProgress" defaultText="Learning Progress" /></h2>
                        <select className="bg-transparent text-sm text-gray-500 border-none outline-none cursor-pointer">
                            <option>Last 30 Days</option>
                            <option>All Time</option>
                        </select>
                    </div>

                    <div className="h-64 flex items-center justify-center text-gray-400 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                        <p><TranslatedText tKey="profile.activityChart" defaultText="Activity Chart Coming Soon" /></p>
                    </div>
                </section>

            </main>
        </div>
    );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode, label: React.ReactNode, value: string | number }) {
    return (
        <div className="bg-white p-6 rounded-2xl border border-[#E5E5E5] shadow-sm flex flex-col gap-4 hover:shadow-md transition-shadow">
            <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center">
                {icon}
            </div>
            <div>
                <p className="text-sm text-gray-500 font-medium mb-1">{label}</p>
                <p className="text-3xl font-bold text-[#1A1A1A]">{value}</p>
            </div>
        </div>
    )
}
