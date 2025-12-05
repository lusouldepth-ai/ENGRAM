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
  // Adjusted to align closer with Anki-style initial steps:
  // Forgot -> 1 minute
  // Hard   -> 10 minutes
  // Good   -> 1 day
  // Easy   -> 4 days (mapped to "good" upstream)

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
      intervalMinutes = 10; // 10 minutes
      nextDue.setMinutes(now.getMinutes() + 10);
      newStatus = 1; // still in (re)learning
      break;
    case 'good':
      intervalMinutes = 24 * 60; // 1 day
      nextDue.setDate(now.getDate() + 1);
      newStatus = 2; // Review
      break;
  }

  // 2. Update Card
  const { error: updateError } = await supabase
    .from('cards')
    .update({
      due: nextDue.toISOString(),
      state: newStatus,
      reps: grade === 'forgot' ? 0 : undefined, // leave reps untouched except reset on forgot
      // Note: a full FSRS should update stability/difficulty; kept minimal here
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

  revalidatePath('/dashboard');
  return { success: true };
}

