'use server';

import { createClient } from "@/lib/supabase/server";

export interface LearningStats {
    totalCards: number;
    masteredCards: number;
    learningCards: number;
    newCards: number;
    todayReviewed: number;
    todayTarget: number;
    streakDays: number;
    weeklyProgress: { day: string; count: number }[];
    totalDecks: number;
}

export async function getLearningStats(): Promise<LearningStats> {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return {
            totalCards: 0,
            masteredCards: 0,
            learningCards: 0,
            newCards: 0,
            todayReviewed: 0,
            todayTarget: 5,
            streakDays: 0,
            weeklyProgress: [],
            totalDecks: 0,
        };
    }

    // Get user profile for daily goal
    const { data: profile } = await supabase
        .from('profiles')
        .select('daily_new_words_goal')
        .eq('id', user.id)
        .single();

    const dailyGoal = profile?.daily_new_words_goal || 10;

    // Get total cards count
    const { count: totalCards } = await supabase
        .from('cards')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

    // Get mastered cards count
    const { count: masteredCards } = await supabase
        .from('cards')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('is_mastered', true);

    // Get learning cards (state = 1 or 2, not mastered)
    const { count: learningCards } = await supabase
        .from('cards')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('is_mastered', false)
        .in('state', [1, 2]);

    // Get new cards (state = 0)
    const { count: newCards } = await supabase
        .from('cards')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('state', 0);

    // Get today's reviewed cards
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const { count: todayReviewed } = await supabase
        .from('study_logs')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('reviewed_at', today.toISOString());

    // Calculate streak days
    const streakDays = await calculateStreakDays(user.id, supabase);

    // Get weekly progress (last 7 days)
    const weeklyProgress = await getWeeklyProgress(user.id, supabase);

    // Get total decks count
    const { count: totalDecks } = await supabase
        .from('decks')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

    return {
        totalCards: totalCards || 0,
        masteredCards: masteredCards || 0,
        learningCards: learningCards || 0,
        newCards: newCards || 0,
        todayReviewed: todayReviewed || 0,
        todayTarget: dailyGoal,
        streakDays,
        weeklyProgress,
        totalDecks: totalDecks || 0,
    };
}

async function calculateStreakDays(userId: string, supabase: any): Promise<number> {
    // Get all unique review dates, sorted descending
    const { data: logs } = await supabase
        .from('study_logs')
        .select('reviewed_at')
        .eq('user_id', userId)
        .order('reviewed_at', { ascending: false });

    if (!logs || logs.length === 0) return 0;

    // Extract unique dates
    const uniqueDates = new Set<string>();
    logs.forEach((log: any) => {
        const date = new Date(log.reviewed_at);
        date.setHours(0, 0, 0, 0);
        uniqueDates.add(date.toISOString().split('T')[0]);
    });

    const sortedDates = Array.from(uniqueDates).sort().reverse();

    // Calculate streak
    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let currentDate = new Date(today);

    for (const dateStr of sortedDates) {
        const logDate = new Date(dateStr);
        const diffDays = Math.floor((currentDate.getTime() - logDate.getTime()) / (1000 * 60 * 60 * 24));

        if (diffDays === 0 || diffDays === 1) {
            streak++;
            currentDate = logDate;
        } else {
            break;
        }
    }

    return streak;
}

async function getWeeklyProgress(userId: string, supabase: any): Promise<{ day: string; count: number }[]> {
    const today = new Date();
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(today.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const { data: logs } = await supabase
        .from('study_logs')
        .select('reviewed_at')
        .eq('user_id', userId)
        .gte('reviewed_at', sevenDaysAgo.toISOString());

    // Count reviews per day
    const dayCounts: { [key: string]: number } = {};

    // Initialize all 7 days with 0
    for (let i = 0; i < 7; i++) {
        const date = new Date(sevenDaysAgo);
        date.setDate(sevenDaysAgo.getDate() + i);
        const dayKey = date.toISOString().split('T')[0];
        dayCounts[dayKey] = 0;
    }

    // Count actual reviews
    logs?.forEach((log: any) => {
        const date = new Date(log.reviewed_at);
        const dayKey = date.toISOString().split('T')[0];
        if (dayCounts[dayKey] !== undefined) {
            dayCounts[dayKey]++;
        }
    });

    // Convert to array format with day names
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return Object.entries(dayCounts).map(([dateStr, count]) => {
        const date = new Date(dateStr);
        return {
            day: dayNames[date.getDay()],
            count,
        };
    });
}

export async function updateDailyGoal(newGoal: number) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { success: false, error: "Unauthorized" };
    }

    // Validate goal (1-100)
    if (newGoal < 1 || newGoal > 100) {
        return { success: false, error: "Goal must be between 1 and 100" };
    }

    const { error } = await supabase
        .from('profiles')
        .update({ daily_goal: newGoal })
        .eq('id', user.id);

    if (error) {
        console.error("Error updating daily goal:", error);
        return { success: false, error: error.message };
    }

    return { success: true };
}

export async function getAllDecks() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return [];

    const { data: decks } = await supabase
        .from('decks')
        .select(`
      id,
      title,
      description,
      created_at,
      cards:cards(count)
    `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

    return decks || [];
}

export async function getDeckWithCards(deckId: string) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return null;

    // Get deck info
    const { data: deck } = await supabase
        .from('decks')
        .select('*')
        .eq('id', deckId)
        .eq('user_id', user.id)
        .single();

    if (!deck) return null;

    // Get all cards in this deck
    const { data: cards } = await supabase
        .from('cards')
        .select('*')
        .eq('deck_id', deckId)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

    return {
        ...deck,
        cards: cards || [],
    };
}
