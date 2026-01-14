'use server';

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

// ============================================
// DAILY VOCABULARY INJECTION SYSTEM
// ============================================

/**
 * 检查并注入每日新单词
 * 在用户打开应用时调用，检查是否需要注入今日新词
 * 
 * 逻辑：
 * 1. 检查 last_new_words_date 是否为今天
 * 2. 如果不是今天，检查待复习卡片是否超过上限
 * 3. 上限 = daily_new_words_goal × 10
 * 4. 如果未超上限，从词库注入新词
 */
export async function checkAndInjectDailyWords(): Promise<{
    success: boolean;
    injected: number;
    skipped: boolean;
    reason?: string;
}> {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { success: false, injected: 0, skipped: true, reason: 'Unauthorized' };
    }

    // 1. 获取用户配置
    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('daily_new_words_goal, last_new_words_date, selected_vocab_book_id')
        .eq('id', user.id)
        .single();

    if (profileError || !profile) {
        console.error('[DailyVocab] Failed to get profile:', profileError);
        return { success: false, injected: 0, skipped: true, reason: 'Profile not found' };
    }

    const dailyGoal = profile.daily_new_words_goal || 10;
    const lastDate = profile.last_new_words_date;
    const selectedBookId = profile.selected_vocab_book_id;

    // 2. 检查是否已经注入过今天的新词
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    if (lastDate === today) {
        return { success: true, injected: 0, skipped: true, reason: 'Already injected today' };
    }

    // 3. 检查是否选择了词库
    if (!selectedBookId) {
        return { success: true, injected: 0, skipped: true, reason: 'No vocab book selected' };
    }

    // 4. 检查复习上限
    const reviewLimit = dailyGoal * 10;
    const dueCardCount = await getReviewCardCount(user.id);

    if (dueCardCount >= reviewLimit) {
        console.log(`[DailyVocab] Review limit reached: ${dueCardCount}/${reviewLimit}. Skipping new word injection.`);
        return {
            success: true,
            injected: 0,
            skipped: true,
            reason: `Review limit reached (${dueCardCount}/${reviewLimit})`
        };
    }

    // 5. 注入新单词
    const injectedCount = await injectWordsFromVocabBook(user.id, selectedBookId, dailyGoal);

    // 6. 更新 last_new_words_date
    await supabase
        .from('profiles')
        .update({ last_new_words_date: today })
        .eq('id', user.id);

    revalidatePath('/dashboard');
    revalidatePath('/learning-center');
    revalidatePath('/review');

    console.log(`[DailyVocab] Injected ${injectedCount} new words for user ${user.id}`);

    return { success: true, injected: injectedCount, skipped: false };
}

/**
 * 获取当前待复习卡片数量
 */
async function getReviewCardCount(userId: string): Promise<number> {
    const supabase = createClient();

    const { count, error } = await supabase
        .from('cards')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('is_mastered', false)
        .lte('due', new Date().toISOString());

    if (error) {
        console.error('[DailyVocab] Failed to get review card count:', error);
        return 0;
    }

    return count || 0;
}

/**
 * 从词库注入单词到用户的 cards 表
 */
async function injectWordsFromVocabBook(
    userId: string,
    bookId: string,
    count: number
): Promise<number> {
    const supabase = createClient();

    // 1. 获取用户当前进度
    const { data: progress } = await supabase
        .from('user_vocab_progress')
        .select('current_word_rank')
        .eq('user_id', userId)
        .eq('book_id', bookId)
        .single();

    const currentRank = progress?.current_word_rank || 0;

    // 2. 获取下一批单词
    const { data: words, error: wordsError } = await supabase
        .from('vocab_words')
        .select('*')
        .eq('book_id', bookId)
        .gt('word_rank', currentRank)
        .order('word_rank', { ascending: true })
        .limit(count);

    if (wordsError || !words || words.length === 0) {
        console.log('[DailyVocab] No more words to inject from this book');
        return 0;
    }

    // 3. 检查用户是否有默认的生词本 deck
    let deckId: string;
    const { data: existingDeck } = await supabase
        .from('decks')
        .select('id')
        .eq('user_id', userId)
        .eq('title', '我的生词本')
        .single();

    if (existingDeck) {
        deckId = existingDeck.id;
    } else {
        // 创建默认生词本
        const { data: newDeck, error: deckError } = await supabase
            .from('decks')
            .insert({
                user_id: userId,
                title: '我的生词本',
                is_preset: false
            })
            .select('id')
            .single();

        if (deckError || !newDeck) {
            console.error('[DailyVocab] Failed to create deck:', deckError);
            return 0;
        }
        deckId = newDeck.id;
    }

    // 4. 检查已存在的单词（去重）
    const wordHeads = words.map(w => w.head_word);
    const { data: existingCards } = await supabase
        .from('cards')
        .select('front')
        .eq('user_id', userId)
        .in('front', wordHeads);

    const existingWords = new Set(existingCards?.map(c => c.front?.toLowerCase()) || []);

    // 5. 创建新的 cards
    const newCards = words
        .filter(word => !existingWords.has(word.head_word?.toLowerCase()))
        .map(word => {
            // 解析 translations 字段提取中文释义
            let translation = '';
            if (word.translations && Array.isArray(word.translations)) {
                translation = word.translations
                    .map((t: any) => `${t.pos || ''} ${t.tranCn || ''}`.trim())
                    .join('; ');
            }

            // 解析例句
            let example = '';
            if (word.sentences && Array.isArray(word.sentences) && word.sentences.length > 0) {
                const firstSentence = word.sentences[0] as { sContent?: string } | null;
                example = firstSentence?.sContent || '';
            }

            return {
                user_id: userId,
                deck_id: deckId,
                front: word.head_word,
                phonetic: word.us_phonetic || word.uk_phonetic || '',
                pos: '', // 从 translations 中提取
                translation: translation,
                definition: '', // 英文定义（词库中可能没有）
                example: example,
                short_usage: '',
                shadow_sentence: '',
                shadow_sentence_translation: '',
                root_analysis: word.memory_method || '',
                state: 0, // New card
                due: new Date().toISOString(),
                reps: 0,
                stability: 0,
                difficulty: 0,
            };
        });

    if (newCards.length === 0) {
        console.log('[DailyVocab] All words already exist in user cards');
        return 0;
    }

    // 6. 批量插入
    const { error: insertError } = await supabase
        .from('cards')
        .insert(newCards);

    if (insertError) {
        console.error('[DailyVocab] Failed to insert cards:', insertError);
        return 0;
    }

    // 7. 更新用户进度
    const maxRank = Math.max(...words.map(w => w.word_rank));

    // 检查是否存在进度记录
    if (progress) {
        await supabase
            .from('user_vocab_progress')
            .update({
                current_word_rank: maxRank,
                completed_count: maxRank,
                last_studied_at: new Date().toISOString()
            })
            .eq('user_id', userId)
            .eq('book_id', bookId);
    } else {
        await supabase
            .from('user_vocab_progress')
            .insert({
                user_id: userId,
                book_id: bookId,
                current_word_rank: maxRank,
                completed_count: maxRank,
                started_at: new Date().toISOString(),
                last_studied_at: new Date().toISOString()
            });
    }

    return newCards.length;
}

/**
 * 获取用户的每日学习状态
 * 用于在 UI 中显示今日进度
 */
export async function getDailyVocabStatus(): Promise<{
    success: boolean;
    data?: {
        dailyGoal: number;
        todayInjected: boolean;
        reviewLimit: number;
        currentDueCount: number;
        canInjectMore: boolean;
        selectedBookTitle?: string;
    };
}> {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { success: false };
    }

    // 获取用户配置
    const { data: profile } = await supabase
        .from('profiles')
        .select('daily_new_words_goal, last_new_words_date, selected_vocab_book_id')
        .eq('id', user.id)
        .single();

    if (!profile) {
        return { success: false };
    }

    const dailyGoal = profile.daily_new_words_goal || 10;
    const reviewLimit = dailyGoal * 10;
    const today = new Date().toISOString().split('T')[0];
    const todayInjected = profile.last_new_words_date === today;

    // 获取待复习数量
    const dueCount = await getReviewCardCount(user.id);

    // 获取已选词书名称
    let bookTitle: string | undefined;
    if (profile.selected_vocab_book_id) {
        const { data: book } = await supabase
            .from('vocab_books')
            .select('title')
            .eq('id', profile.selected_vocab_book_id)
            .single();
        bookTitle = book?.title;
    }

    return {
        success: true,
        data: {
            dailyGoal,
            todayInjected,
            reviewLimit,
            currentDueCount: dueCount,
            canInjectMore: dueCount < reviewLimit,
            selectedBookTitle: bookTitle
        }
    };
}

/**
 * 手动触发今日新词注入（用于测试或用户主动请求）
 */
export async function manualInjectDailyWords(): Promise<{
    success: boolean;
    injected: number;
    error?: string;
}> {
    const result = await checkAndInjectDailyWords();

    if (!result.success) {
        return { success: false, injected: 0, error: result.reason };
    }

    return { success: true, injected: result.injected };
}

/**
 * 更新用户选择的词库
 */
export async function updateSelectedVocabBook(bookId: string): Promise<{
    success: boolean;
    error?: string;
}> {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { success: false, error: 'Unauthorized' };
    }

    const { error } = await supabase
        .from('profiles')
        .update({ selected_vocab_book_id: bookId })
        .eq('id', user.id);

    if (error) {
        console.error('[DailyVocab] Failed to update selected book:', error);
        return { success: false, error: error.message };
    }

    revalidatePath('/settings');
    revalidatePath('/dashboard');

    return { success: true };
}
