'use server';

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { processReview, shouldMarkAsMastered, previewAllRatings, type AppRating } from "@/lib/services/fsrs";

// 错词本阈值：连续多少次 forgot 后自动添加到错词本
const MISTAKE_THRESHOLD = 3;

export async function getDueCards() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return [];

  // Fetch cards where due <= now
  // Limit to 50 cards to allow for deduplication filtering
  const { data: cards, error } = await supabase
    .from('cards')
    .select('*')
    .eq('user_id', user.id)
    .eq('is_mastered', false) // 不显示已掌握的卡片
    .lte('due', new Date().toISOString())
    .order('due', { ascending: true })
    .limit(50);

  if (error) {
    console.error("Error fetching due cards:", error);
    return [];
  }

  if (!cards || cards.length === 0) return [];

  // 去重：如果同一个单词在多个卡片组中出现（如四级和六级都有），只显示一个
  // 保留最早到期（排序已是 ascending）且优先保留已有复习记录的
  const seenWords = new Set<string>();
  const deduplicatedCards = cards.filter(card => {
    const word = card.front?.toLowerCase().trim();
    if (!word) return true; // 保留无法判断的卡片

    if (seenWords.has(word)) {
      console.log(`🔄 [Dedup] Skipping duplicate word: "${card.front}"`);
      return false;
    }
    seenWords.add(word);
    return true;
  });

  // 返回去重后的前20张卡片
  return deduplicatedCards.slice(0, 20);
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
 * 检查卡片是否应该添加到错词本（连续多次 forgot）
 */
async function checkAndAddToMistakeBook(
  supabase: any,
  userId: string,
  cardId: string,
  currentGrade: string
): Promise<boolean> {
  if (currentGrade !== 'forgot') return false;

  // 获取该卡片最近的复习记录，检查连续 forgot 次数
  const { data: recentLogs } = await supabase
    .from('study_logs')
    .select('grade')
    .eq('card_id', cardId)
    .eq('user_id', userId)
    .order('reviewed_at', { ascending: false })
    .limit(MISTAKE_THRESHOLD);

  if (!recentLogs || recentLogs.length < MISTAKE_THRESHOLD - 1) {
    return false;
  }

  // 检查是否连续都是 forgot (grade = 1)
  const allForgot = recentLogs.every((log: any) => log.grade === 1);

  if (!allForgot) return false;

  // 获取卡片信息
  const { data: card } = await supabase
    .from('cards')
    .select('front, phonetic, pos, translation, definition, example, short_usage, shadow_sentence, shadow_sentence_translation, root_analysis, deck_id')
    .eq('id', cardId)
    .eq('user_id', userId)
    .single();

  if (!card) return false;

  // 检查是否已经在错词本中（避免重复添加）
  const { data: existingMistake } = await supabase
    .from('cards')
    .select('id')
    .eq('user_id', userId)
    .eq('front', card.front)
    .neq('deck_id', card.deck_id);

  // 获取或创建"我的错词本"
  let mistakeDeckId: string | null = null;

  const { data: mistakeDeck } = await supabase
    .from('decks')
    .select('id')
    .eq('user_id', userId)
    .eq('title', '我的错词本')
    .single();

  if (mistakeDeck) {
    mistakeDeckId = mistakeDeck.id;
  } else {
    // 创建错词本
    const { data: newDeck } = await supabase
      .from('decks')
      .insert({
        user_id: userId,
        title: '我的错词本',
        is_preset: false
      })
      .select('id')
      .single();

    if (newDeck) {
      mistakeDeckId = newDeck.id;
    }
  }

  if (!mistakeDeckId) return false;

  // 检查是否已经在错词本中
  const { data: alreadyInMistakeBook } = await supabase
    .from('cards')
    .select('id')
    .eq('user_id', userId)
    .eq('deck_id', mistakeDeckId)
    .eq('front', card.front)
    .single();

  if (alreadyInMistakeBook) {
    console.log(`📝 [错词本] "${card.front}" 已在错词本中`);
    return false;
  }

  // 复制卡片到错词本
  const { error: insertError } = await supabase
    .from('cards')
    .insert({
      user_id: userId,
      deck_id: mistakeDeckId,
      front: card.front,
      phonetic: card.phonetic || '',
      pos: card.pos || '',
      translation: card.translation || '',
      definition: card.definition || '',
      example: card.example || '',
      short_usage: card.short_usage || '',
      shadow_sentence: card.shadow_sentence || '',
      shadow_sentence_translation: card.shadow_sentence_translation || '',
      root_analysis: card.root_analysis || '',
      state: 0,
      due: new Date().toISOString(),
      reps: 0,
      stability: 0,
      difficulty: 0,
    });

  if (insertError) {
    console.error('添加到错词本失败:', insertError);
    return false;
  }

  console.log(`📕 [错词本] "${card.front}" 连续 ${MISTAKE_THRESHOLD} 次遗忘，已自动添加到错词本`);
  return true;
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

  // 6. 检查是否需要添加到错词本
  const addedToMistakeBook = await checkAndAddToMistakeBook(supabase, user.id, cardId, grade);

  revalidatePath('/dashboard');
  revalidatePath('/review');
  revalidatePath('/learning-center');

  return {
    success: true,
    nextReview: newState.scheduledDays,
    isMastered,
    addedToMistakeBook
  };
}

