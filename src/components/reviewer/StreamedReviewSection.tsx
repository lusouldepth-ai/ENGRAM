import { createClient } from "@/lib/supabase/server";
import { Database } from "@/lib/supabase/types";
import ReviewSection from "@/components/reviewer/ReviewSection";

type Card = Database["public"]["Tables"]["cards"]["Row"];

// Direct DB queries for server-side data fetching
async function getServerDueCards(userId: string, supabase: ReturnType<typeof createClient>): Promise<Card[]> {
    const { data: cards, error } = await supabase
        .from('cards')
        .select('*')
        .eq('user_id', userId)
        .eq('is_mastered', false)
        .lte('due', new Date().toISOString())
        .order('due', { ascending: true })
        .limit(50);

    if (error || !cards) return [];

    // Deduplicate by word
    const seenWords = new Set<string>();
    const deduplicatedCards = cards.filter(card => {
        const word = card.front?.toLowerCase().trim();
        if (!word) return true;
        if (seenWords.has(word)) return false;
        seenWords.add(word);
        return true;
    });

    return deduplicatedCards.slice(0, 20);
}

async function getServerTodayReviewedCount(userId: string, supabase: ReturnType<typeof createClient>): Promise<number> {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const { data, error } = await supabase
        .from('study_logs')
        .select('card_id')
        .eq('user_id', userId)
        .gte('reviewed_at', todayStart.toISOString());

    if (error || !data) return 0;

    const uniqueCardIds = new Set(data.map((log: any) => log.card_id));
    return uniqueCardIds.size;
}

interface StreamedReviewSectionProps {
    userId: string;
    profile?: { tier: string | null; accent_preference: string | null } | null;
}

// This component is a Server Component that fetches data and renders ReviewSection
// It will be wrapped in Suspense on the parent page
export async function StreamedReviewSection({ userId, profile }: StreamedReviewSectionProps) {
    const supabase = createClient();

    // Parallel data fetching
    const [dueCards, todayReviewedCount] = await Promise.all([
        getServerDueCards(userId, supabase),
        getServerTodayReviewedCount(userId, supabase)
    ]);

    return (
        <ReviewSection
            profile={profile ? { tier: profile.tier, accent_preference: profile.accent_preference } : undefined}
            initialCards={dueCards}
            initialTodayCount={todayReviewedCount}
        />
    );
}
