'use server';

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function getDueCards() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return [];

  // Fetch cards where due <= now
  // We also might want to limit the number of cards per session (e.g. 20)
  const { data: cards, error } = await supabase
    .from('cards')
    .select('*')
    .eq('user_id', user.id)
    .lte('due', new Date().toISOString())
    .order('due', { ascending: true })
    .limit(20);

  if (error) {
    console.error("Error fetching due cards:", error);
    return [];
  }

  return cards || [];
}

export async function reviewCard(cardId: string, grade: 'forgot' | 'hard' | 'good') {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { success: false, error: "Unauthorized" };

  // 1. Calculate new SRS parameters (Simplified FSRS-like logic per PRD)
  // PRD Logic:
  // Forgot -> 1 min later
  // Hard -> 2 days later
  // Good -> 4 days later
  
  let intervalMinutes = 0;
  let newStatus = 1; // Learning/Review

  const now = new Date();
  const nextDue = new Date(now);

  switch (grade) {
    case 'forgot':
      intervalMinutes = 1; // 1 minute
      nextDue.setMinutes(now.getMinutes() + 1);
      newStatus = 1; // Reset to learning/re-learning
      break;
    case 'hard':
      intervalMinutes = 2 * 24 * 60; // 2 days
      nextDue.setDate(now.getDate() + 2);
      newStatus = 2; // Review
      break;
    case 'good':
      intervalMinutes = 4 * 24 * 60; // 4 days
      nextDue.setDate(now.getDate() + 4);
      newStatus = 2; // Review
      break;
  }

  // 2. Update Card
  const { error: updateError } = await supabase
    .from('cards')
    .update({
      due: nextDue.toISOString(),
      state: newStatus,
      reps: 0, // Ideally increment, but simple update for now
      // In a real FSRS, we would update stability/difficulty here
    })
    .eq('id', cardId)
    .eq('user_id', user.id);

  if (updateError) {
    console.error("Error updating card:", updateError);
    return { success: false, error: updateError.message };
  }

  // 3. Log Review
  const { error: logError } = await supabase
    .from('study_logs')
    .insert({
      user_id: user.id,
      card_id: cardId,
      grade: grade === 'forgot' ? 1 : grade === 'hard' ? 2 : 3,
      reviewed_at: now.toISOString()
    });

  if (logError) {
     console.error("Error logging review:", logError);
  }

  revalidatePath('/review');
  return { success: true };
}

