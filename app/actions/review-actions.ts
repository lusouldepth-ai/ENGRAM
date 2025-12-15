'use server';

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { processReview, shouldMarkAsMastered, previewAllRatings, type AppRating } from "@/lib/services/fsrs";

export async function getDueCards() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return [];

  // Fetch cards where due <= now
  // Limit to 20 cards per session
  const { data: cards, error } = await supabase
    .from('cards')
    .select('*')
    .eq('user_id', user.id)
    .eq('is_mastered', false) // 不显示已掌握的卡片
    .lte('due', new Date().toISOString())
    .order('due', { ascending: true })
    .limit(20);

  if (error) {
    console.error("Error fetching due cards:", error);
    return [];
  }

  return cards || [];
}

/**
 * 获取卡片的四个评分选项的预览间隔
 */
export async function getIntervalPreview(cardId: string) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: card, error } = await supabase
    .from('cards')
    .select('due, stability, difficulty, reps, state')
    .eq('id', cardId)
    .eq('user_id', user.id)
    .single();

  if (error || !card) {
    return null;
  }

  return previewAllRatings(card);
}

/**
 * 处理卡片复习
 * 使用完整 FSRS-5 算法计算下次复习时间
 */
export async function reviewCard(cardId: string, grade: 'forgot' | 'hard' | 'good' | 'easy') {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { success: false, error: "Unauthorized" };

  // 1. 获取当前卡片状态
  const { data: currentCard, error: fetchError } = await supabase
    .from('cards')
    .select('due, stability, difficulty, reps, state')
    .eq('id', cardId)
    .eq('user_id', user.id)
    .single();

  if (fetchError || !currentCard) {
    console.error("Error fetching card:", fetchError);
    return { success: false, error: "Card not found" };
  }

  // 2. 使用 FSRS 算法计算新状态
  const rating: AppRating = grade;
  const newState = processReview(currentCard, rating);

  console.log(`📊 [FSRS] Card ${cardId}: ${grade} → 下次复习: ${newState.scheduledDays} 天后`);
  console.log(`   stability: ${currentCard.stability} → ${newState.stability.toFixed(2)}`);
  console.log(`   difficulty: ${currentCard.difficulty} → ${newState.difficulty.toFixed(2)}`);

  // 3. 判断是否应该标记为已掌握
  const isMastered = shouldMarkAsMastered(newState.stability, newState.reps, rating);

  if (isMastered) {
    console.log(`🎉 [FSRS] Card ${cardId} 已掌握！`);
  }

  // 4. 更新卡片
  const { error: updateError } = await supabase
    .from('cards')
    .update({
      due: newState.due,
      stability: newState.stability,
      difficulty: newState.difficulty,
      reps: newState.reps,
      state: newState.state,
      is_mastered: isMastered,
    })
    .eq('id', cardId)
    .eq('user_id', user.id);

  if (updateError) {
    console.error("Error updating card:", updateError);
    return { success: false, error: updateError.message };
  }

  // 5. 记录复习日志
  const gradeValue = grade === 'forgot' ? 1 : grade === 'hard' ? 2 : grade === 'good' ? 3 : 4;
  const { error: logError } = await supabase
    .from('study_logs')
    .insert({
      user_id: user.id,
      card_id: cardId,
      grade: gradeValue,
      reviewed_at: new Date().toISOString()
    });

  if (logError) {
    console.error("Error logging review:", logError);
  }

  revalidatePath('/dashboard');
  revalidatePath('/review');

  return {
    success: true,
    nextReview: newState.scheduledDays,
    isMastered
  };
}
