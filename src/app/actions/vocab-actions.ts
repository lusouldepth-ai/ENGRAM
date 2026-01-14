'use server';

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import fs from 'fs/promises';
import path from 'path';

// ============================================
// VOCABULARY BOOKS ACTIONS
// ============================================

/**
 * 获取所有词书列表
 */
export async function getVocabBooks(filters?: {
    cefrLevel?: string;
    category?: string;
}) {
    const supabase = createClient();

    let query = supabase
        .from('vocab_books')
        .select('*')
        .order('created_at', { ascending: false });

    if (filters?.cefrLevel) {
        query = query.eq('cefr_level', filters.cefrLevel);
    }
    if (filters?.category) {
        query = query.eq('category', filters.category);
    }

    const { data: books, error } = await query;

    if (error) {
        console.error('Error fetching vocab books:', error);
        return { success: false, error: error.message };
    }

    return { success: true, books };
}

/**
 * 根据用户 CEFR 等级推荐词书
 */
export async function getRecommendedBooks() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { success: false, error: 'Unauthorized' };
    }

    // Use default user level (can be made configurable later)
    const userLevel = 'B1';

    // 推荐匹配等级的词书
    const { data: books, error } = await supabase
        .from('vocab_books')
        .select('*')
        .eq('cefr_level', userLevel)
        .order('word_count', { ascending: true });

    if (error) {
        console.error('Error fetching recommended books:', error);
        return { success: false, error: error.message };
    }

    return { success: true, books, userLevel };
}

/**
 * 获取词书详情
 */
export async function getVocabBookDetail(bookId: string) {
    const supabase = createClient();

    const { data: book, error } = await supabase
        .from('vocab_books')
        .select('*')
        .eq('id', bookId)
        .single();

    if (error) {
        console.error('Error fetching book detail:', error);
        return { success: false, error: error.message };
    }

    return { success: true, book };
}

// ============================================
// VOCABULARY WORDS ACTIONS
// ============================================

/**
 * 分页获取词书单词
 */
export async function getBookWords(
    bookId: string,
    offset: number = 0,
    limit: number = 20
) {
    const supabase = createClient();

    const { data: words, error, count } = await supabase
        .from('vocab_words')
        .select('*', { count: 'exact' })
        .eq('book_id', bookId)
        .order('word_rank', { ascending: true })
        .range(offset, offset + limit - 1);

    if (error) {
        console.error('Error fetching book words:', error);
        return { success: false, error: error.message };
    }

    return { success: true, words, total: count };
}

/**
 * 获取下一批待学习单词
 */
export async function getNextWordsToLearn(bookId: string, count: number = 10) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { success: false, error: 'Unauthorized' };
    }

    // 获取用户当前进度
    const { data: progress } = await supabase
        .from('user_vocab_progress')
        .select('current_word_rank')
        .eq('user_id', user.id)
        .eq('book_id', bookId)
        .single();

    const currentRank = progress?.current_word_rank || 0;

    // 获取下一批单词
    const { data: words, error } = await supabase
        .from('vocab_words')
        .select('*')
        .eq('book_id', bookId)
        .gt('word_rank', currentRank)
        .order('word_rank', { ascending: true })
        .limit(count);

    if (error) {
        console.error('Error fetching next words:', error);
        return { success: false, error: error.message };
    }

    return { success: true, words, currentRank };
}

// ============================================
// USER PROGRESS ACTIONS
// ============================================

/**
 * 开始学习词书
 */
export async function startLearningBook(bookId: string) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { success: false, error: 'Unauthorized' };
    }

    // 检查是否已经在学习
    const { data: existing } = await supabase
        .from('user_vocab_progress')
        .select('id')
        .eq('user_id', user.id)
        .eq('book_id', bookId)
        .single();

    if (existing) {
        return { success: true, message: '已在学习中' };
    }

    // 创建学习记录
    const { error } = await supabase
        .from('user_vocab_progress')
        .insert({
            user_id: user.id,
            book_id: bookId,
            current_word_rank: 0,
            completed_count: 0
        });

    if (error) {
        console.error('Error starting book:', error);
        return { success: false, error: error.message };
    }

    revalidatePath('/vocab-library');
    return { success: true };
}

/**
 * 更新学习进度
 */
export async function updateVocabProgress(bookId: string, wordRank: number) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { success: false, error: 'Unauthorized' };
    }

    const { error } = await supabase
        .from('user_vocab_progress')
        .update({
            current_word_rank: wordRank,
            completed_count: wordRank,
            last_studied_at: new Date().toISOString()
        })
        .eq('user_id', user.id)
        .eq('book_id', bookId);

    if (error) {
        console.error('Error updating progress:', error);
        return { success: false, error: error.message };
    }

    return { success: true };
}

/**
 * 获取用户正在学习的词书列表
 */
export async function getUserLearningBooks() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { success: false, error: 'Unauthorized' };
    }

    const { data: progress, error } = await supabase
        .from('user_vocab_progress')
        .select(`
            *,
            vocab_books (*)
        `)
        .eq('user_id', user.id)
        .order('last_studied_at', { ascending: false });

    if (error) {
        console.error('Error fetching user books:', error);
        return { success: false, error: error.message };
    }

    return { success: true, progress };
}

// ============================================
// IMPORT ACTIONS
// ============================================

/**
 * 导入词库 JSON 文件
 */
export async function importVocabBook(
    jsonFilePath: string,
    bookMeta: {
        title: string;
        category: string;
        cefrLevel: string;
        description?: string;
        coverImage?: string;
    }
) {
    const supabase = createClient();

    try {
        // 读取 JSON 文件
        // 注意：在 Vercel 生产环境中，这些文件不会被部署
        // 导入功能应该在本地环境或通过其他方式（如 Supabase Storage）完成
        const filePath = path.join(process.cwd(), 'data', jsonFilePath);

        // 检查文件是否存在（Vercel 环境中可能不存在）
        try {
            await fs.access(filePath);
        } catch {
            return {
                success: false,
                error: 'JSON 文件未找到。在生产环境中，请使用 Supabase Storage 或其他方式存储词库文件。'
            };
        }

        const fileContent = await fs.readFile(filePath, 'utf-8');
        const words = JSON.parse(fileContent);

        if (!Array.isArray(words)) {
            return { success: false, error: 'JSON file must contain an array' };
        }

        // 提取 bookId
        const bookId = words[0]?.bookId || jsonFilePath.replace('.json', '');

        // 创建词书记录
        const { data: book, error: bookError } = await supabase
            .from('vocab_books')
            .insert({
                book_id: bookId,
                title: bookMeta.title,
                word_count: words.length,
                cover_image: bookMeta.coverImage,
                cefr_level: bookMeta.cefrLevel,
                category: bookMeta.category,
                description: bookMeta.description
            })
            .select('id')
            .single();

        if (bookError) {
            console.error('Error creating book:', bookError);
            return { success: false, error: bookError.message };
        }

        // 批量插入单词 (每批 100 个)
        const batchSize = 100;
        let insertedCount = 0;

        for (let i = 0; i < words.length; i += batchSize) {
            const batch = words.slice(i, i + batchSize);

            const vocabWords = batch.map((word: any) => ({
                book_id: book.id,
                word_rank: word.wordRank,
                head_word: word.headWord,
                us_phonetic: word.content?.word?.content?.usphone || null,
                uk_phonetic: word.content?.word?.content?.ukphone || null,
                translations: word.content?.word?.content?.trans || null,
                sentences: word.content?.word?.content?.sentence?.sentences || null,
                real_exam_sentences: word.content?.word?.content?.realExamSentence?.sentences || null,
                synonyms: word.content?.word?.content?.syno?.synos || null,
                phrases: word.content?.word?.content?.phrase?.phrases || null,
                memory_method: word.content?.word?.content?.remMethod?.val || null,
                related_words: word.content?.word?.content?.relWord?.rels || null,
                picture_url: word.content?.word?.content?.picture || null,
                exams: word.content?.word?.content?.exam || null,
                raw_content: word
            }));

            const { error: insertError } = await supabase
                .from('vocab_words')
                .insert(vocabWords);

            if (insertError) {
                console.error('Error inserting batch:', insertError);
                // 继续处理其他批次
            } else {
                insertedCount += batch.length;
            }
        }

        console.log(`📚 Imported ${insertedCount}/${words.length} words for "${bookMeta.title}"`);

        revalidatePath('/vocab-library');
        return {
            success: true,
            bookId: book.id,
            importedCount: insertedCount,
            totalCount: words.length
        };

    } catch (error: any) {
        console.error('Import error:', error);
        return { success: false, error: error.message };
    }
}

// ============================================
// USER SETTINGS
// ============================================

/**
 * 更新每日新词目标
 */
export async function updateDailyNewWordsGoal(goal: number) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { success: false, error: 'Unauthorized' };
    }

    // Validate goal (5-50)
    const validGoal = Math.max(5, Math.min(50, goal));

    const { error } = await supabase
        .from('profiles')
        .update({ daily_new_words_goal: validGoal })
        .eq('id', user.id);

    if (error) {
        console.error('Error updating daily goal:', error);
        return { success: false, error: error.message };
    }

    revalidatePath('/settings');
    return { success: true, goal: validGoal };
}

/**
 * 获取用户每日学习统计（新词 + 复习）
 */
export async function getDailyLearningStats() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { success: false, error: 'Unauthorized' };
    }

    // 获取用户配置的每日目标
    const { data: profile } = await supabase
        .from('profiles')
        .select('daily_new_words_goal')
        .eq('id', user.id)
        .single();

    const dailyGoal = profile?.daily_new_words_goal || 10;

    // 今日日期范围
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    // 获取今日复习数量
    const { count: reviewedCount } = await supabase
        .from('study_logs')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('reviewed_at', todayStart.toISOString())
        .lte('reviewed_at', todayEnd.toISOString());

    // 获取待复习数量
    const { count: dueCount } = await supabase
        .from('cards')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('is_mastered', false)
        .lte('due', new Date().toISOString());

    return {
        success: true,
        stats: {
            newWordsGoal: dailyGoal,
            newWordsCompleted: 0, // TODO: 从词书进度计算
            reviewDue: dueCount || 0,
            reviewCompleted: reviewedCount || 0,
            totalGoal: dailyGoal + (dueCount || 0),
            totalCompleted: reviewedCount || 0
        }
    };
}
