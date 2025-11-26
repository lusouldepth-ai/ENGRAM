'use server';

import { createClient } from "@/lib/supabase/server";
import { generateCards } from "./generate-cards";
import { saveCards } from "./save-cards";

export async function updateProfile(data: {
    display_name?: string;
    learning_goal?: string;
    target_score?: string;
    exam_date?: string;
    english_level?: string;
    accent_preference?: string;
}) {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
        return { success: false, error: "Unauthorized" };
    }

    // Calculate initial daily goal (Logic: if exam date is near, increase goal? For now default to 20)
    const daily_goal = 20;

    const { error } = await supabase
        .from('profiles')
        .update({ ...data, daily_goal })
        .eq('id', user.id);

    if (error) {
        console.error("Profile Update Error:", error);
        return { success: false, error: error.message };
    }

    return { success: true };
}

export async function generateStarterCards(userContext: string, level: string) {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
        return { success: false, error: "Unauthorized" };
    }

    // 简化 prompt，CEFR 标准已在 generate-cards.ts 中定义
    const prompt = `为 ${userContext} 场景生成最实用的核心词汇`;

    // 减少到5个词汇以加快响应速度（从60秒降至约20秒）
    const genResult = await generateCards(prompt, { goal: userContext, level }, 5);

    if (!genResult.success || !genResult.data) {
        return { success: false, error: "Failed to generate cards" };
    }

    return { success: true, cards: genResult.data };
}

export async function saveStarterCards(cards: any[]) {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
        return { success: false, error: "Unauthorized" };
    }

    // 1. Update Profile (Mark as completed)
    const { error: profileError } = await supabase
        .from('profiles')
        .update({
            onboarding_completed: true
        })
        .eq('id', user.id);

    if (profileError) {
        console.error("Profile Update Error:", profileError);
    }

    // 2. Save Cards
    const saveResult = await saveCards(cards, "Starter Deck");

    if (!saveResult.success) {
        return { success: false, error: saveResult.error };
    }

    return { success: true };
}
