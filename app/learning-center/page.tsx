import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Navbar } from "@/components/landing/Navbar";
import { getLearningStats, getAllDecks } from "@/app/actions/learning-stats";
import LearningCenterClient from "./learning-center-client";

export const dynamic = "force-dynamic";

export default async function LearningCenterPage() {
    const supabase = createClient();

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect("/login");
    }

    const [stats, decks] = await Promise.all([
        getLearningStats(),
        getAllDecks(),
    ]);

    return (
        <main className="min-h-screen bg-[#F4F4F0] text-[#1A1A1A] font-sans selection:bg-[#EA580C] selection:text-white flex flex-col">
            <Navbar user={user} />

            <div className="flex-1 w-full max-w-7xl mx-auto p-6 md:p-12">
                <div className="mb-8">
                    <h1 className="text-4xl font-bold text-braun-text mb-2">学习中心</h1>
                    <p className="text-gray-500">Track your progress and manage your vocabulary decks</p>
                </div>

                <LearningCenterClient stats={stats} decks={decks} />
            </div>
        </main>
    );
}
