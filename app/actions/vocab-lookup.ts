'use server';

import { createClient } from "@/lib/supabase/server";

/**
 * 查找词库中的单词
 * 返回完整的词库数据，如果找到的话
 */
export async function lookupVocabWord(word: string) {
    const supabase = createClient();

    const { data, error } = await supabase
        .from('vocab_words')
        .select(`
            *,
            vocab_books (
                title,
                cefr_level,
                category
            )
        `)
        .ilike('head_word', word.trim())
        .limit(1)
        .single();

    if (error || !data) {
        return { found: false, word: null };
    }

    return {
        found: true,
        word: data,
        book: data.vocab_books
    };
}

/**
 * 搜索词库中匹配的单词（用于自动补全）
 */
export async function searchVocabWords(query: string, limit: number = 5) {
    if (!query || query.length < 2) {
        return { words: [] };
    }

    const supabase = createClient();

    const { data, error } = await supabase
        .from('vocab_words')
        .select(`
            id,
            head_word,
            us_phonetic,
            translations,
            vocab_books (
                title,
                cefr_level
            )
        `)
        .ilike('head_word', `${query.trim()}%`)
        .order('word_rank', { ascending: true })
        .limit(limit);

    if (error) {
        console.error('Vocab search error:', error);
        return { words: [] };
    }

    return {
        words: data?.map(w => ({
            id: w.id,
            word: w.head_word,
            phonetic: w.us_phonetic,
            translation: w.translations?.[0]?.tranCn || '',
            level: w.vocab_books?.cefr_level,
            book: w.vocab_books?.title
        })) || []
    };
}

/**
 * 获取用户等级推荐的词汇
 */
export async function getRecommendedVocab(count: number = 5) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { words: [] };
    }

    // 获取用户等级
    const { data: profile } = await supabase
        .from('profiles')
        .select('cefr_level')
        .eq('id', user.id)
        .single();

    const userLevel = profile?.cefr_level || 'B1';

    // 获取匹配等级的词书
    const { data: books } = await supabase
        .from('vocab_books')
        .select('id')
        .eq('cefr_level', userLevel);

    if (!books || books.length === 0) {
        return { words: [], level: userLevel };
    }

    const bookIds = books.map(b => b.id);

    // 随机获取词汇
    const { data: words, error } = await supabase
        .from('vocab_words')
        .select(`
            id,
            head_word,
            us_phonetic,
            translations,
            vocab_books (
                title,
                cefr_level
            )
        `)
        .in('book_id', bookIds)
        .limit(count * 3); // 获取多一些用于随机

    if (error || !words) {
        return { words: [], level: userLevel };
    }

    // 随机选择
    const shuffled = words.sort(() => Math.random() - 0.5).slice(0, count);

    return {
        words: shuffled.map(w => ({
            id: w.id,
            word: w.head_word,
            phonetic: w.us_phonetic,
            translation: w.translations?.[0]?.tranCn || '',
            level: w.vocab_books?.cefr_level,
            book: w.vocab_books?.title
        })),
        level: userLevel
    };
}
