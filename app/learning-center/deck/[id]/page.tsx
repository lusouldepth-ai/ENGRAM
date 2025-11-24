import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { Navbar } from "@/components/landing/Navbar";
import { getDeckWithCards } from "@/app/actions/learning-stats";
import DeckDetailClient from "./deck-detail-client";

export const dynamic = "force-dynamic";

export default async function DeckDetailPage({ params }: { params: { id: string } }) {
    const supabase = createClient();

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect("/login");
    }

    const deckData = await getDeckWithCards(params.id);

    if (!deckData) {
        notFound();
    }

    return (
        <main className="min-h-screen bg-[#F4F4F0] text-[#1A1A1A] font-sans selection:bg-[#EA580C] selection:text-white flex flex-col">
            <Navbar user={user} />

            <div className="flex-1 w-full max-w-7xl mx-auto p-6 md:p-12">
                <DeckDetailClient deck={deckData} />
            </div>
        </main>
    );
}
