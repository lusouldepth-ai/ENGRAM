'use server';

import { createClient } from "@/lib/supabase/server";
import { generateCards } from "./generate-cards";
import { saveCards } from "./save-cards";

export async function updateProfile(data: {
    learning_goal?: string;
    english_level?: string;
    accent_preference?: string;
}) {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
        return { success: false, error: "Unauthorized" };
    }

    const { error } = await supabase
        .from('profiles')
        .update(data)
        .eq('id', user.id);

    if (error) {
        console.error("Profile Update Error:", error);
        return { success: false, error: error.message };
    }

    return { success: true };
}

export async function completeOnboarding(goal: string, level: string) {
  const supabase = createClient();
  
  try {
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

    // 2. Generate Starter Cards
    const prompt = `Generate 5 essential vocabulary words for a ${level} learner focusing on ${goal}.`;
    
    const genResult = await generateCards(prompt, { goal, level });
    
    if (!genResult.success || !genResult.data) {
        return { success: false, error: "Failed to generate cards" };
    }

    // 3. Save Cards
    const saveResult = await saveCards(genResult.data, "Starter Deck");
    
    if (!saveResult.success) {
        return { success: false, error: saveResult.error };
    }

    return { success: true };

  } catch (error: any) {
    console.error("Onboarding Error:", error);
    return { success: false, error: error.message };
  }
}

