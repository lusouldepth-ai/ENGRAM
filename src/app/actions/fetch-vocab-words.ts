'use server';

import { createClient } from '@/lib/supabase/server';

// 关键词到词书的映射
const KEYWORD_TO_BOOK: Record<string, string[]> = {
    // 四六级
    '四级': ['四级完整词库', '四级真题核心词'],
    'cet4': ['四级完整词库', '四级真题核心词'],
    '六级': ['六级完整词库', '六级真题核心词'],
    'cet6': ['六级完整词库', '六级真题核心词'],

    // 考研
    '考研': ['考研完整词库', '考研核心词汇'],
    'kaoyan': ['考研完整词库', '考研核心词汇'],
    'postgraduate': ['考研完整词库', '考研核心词汇'],

    // 专四专八
    '专四': ['专四完整词库', '专四高频词'],
    'tem4': ['专四完整词库', '专四高频词'],
    '专八': ['专八完整词库', '专八高频词'],
    'tem8': ['专八完整词库', '专八高频词'],

    // 出国留学
    '雅思': ['雅思词汇'],
    'ielts': ['雅思词汇'],
    '托福': ['托福词汇'],
    'toefl': ['托福词汇'],
    'gre': ['GRE词汇'],
    'sat': ['SAT词汇'],
    'gmat': ['GMAT词汇'],

    // 商务
    '商务': ['商务词汇'],
    'business': ['商务词汇'],
    'bec': ['商务词汇'],
};

// 根据用户输入识别匹配的词书
function detectVocabBook(input: string, goal?: string): string[] {
    const searchText = `${input} ${goal || ''}`.toLowerCase();

    for (const [keyword, bookTitles] of Object.entries(KEYWORD_TO_BOOK)) {
        if (searchText.includes(keyword.toLowerCase())) {
            return bookTitles;
        }
    }

    return []; // 没有匹配到任何词书
}

// 从数据库获取词汇（排除用户已有的单词）
export async function fetchVocabWords(
    input: string,
    goal: string | undefined,
    limit: number = 5
): Promise<{ success: boolean; words?: any[]; bookTitle?: string; error?: string }> {

    const supabase = createClient();

    // 获取当前用户
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        console.log('📚 [Vocab] No authenticated user');
        return { success: false, error: 'UNAUTHORIZED' };
    }

    // 1. 识别匹配的词书
    const matchedBookTitles = detectVocabBook(input, goal);

    if (matchedBookTitles.length === 0) {
        console.log('📚 [Vocab] No matching vocab book found for:', input);
        return { success: false, error: 'NO_MATCHING_BOOK' };
    }

    console.log('📚 [Vocab] Matched book titles:', matchedBookTitles);

    // 2. 查找词书
    const { data: books, error: bookError } = await supabase
        .from('vocab_books')
        .select('id, title, word_count')
        .in('title', matchedBookTitles)
        .limit(1);

    if (bookError || !books || books.length === 0) {
        console.log('📚 [Vocab] Book not found in database');
        return { success: false, error: 'BOOK_NOT_FOUND' };
    }

    const book = books[0];
    console.log(`📚 [Vocab] Found book: ${book.title} (${book.word_count} words)`);

    // 3. 获取用户已有的单词列表（从 cards 表）
    const { data: existingCards } = await supabase
        .from('cards')
        .select('front')
        .eq('user_id', user.id);

    const existingWords = new Set(
        (existingCards || []).map(card => card.front?.toLowerCase())
    );

    console.log(`📚 [Vocab] User has ${existingWords.size} existing words to exclude`);

    // 4. 获取词汇，需要多取一些以便排除已有的
    const fetchLimit = limit + existingWords.size + 20; // 多取一些以确保有足够新词
    const maxRank = Math.min(book.word_count, 1000); // 从前1000个高频词中选
    const randomOffset = Math.floor(Math.random() * Math.max(1, maxRank - fetchLimit));

    const { data: allWords, error: wordError } = await supabase
        .from('vocab_words')
        .select(`
      id,
      head_word,
      us_phonetic,
      uk_phonetic,
      translations,
      sentences,
      real_exam_sentences,
      synonyms,
      phrases,
      memory_method,
      related_words
    `)
        .eq('book_id', book.id)
        .gte('word_rank', randomOffset)
        .order('word_rank', { ascending: true })
        .limit(fetchLimit);

    if (wordError) {
        console.error('📚 [Vocab] Error fetching words:', wordError);
        return { success: false, error: wordError.message };
    }

    // 5. 过滤掉用户已有的单词
    const newWords = (allWords || []).filter(
        word => !existingWords.has(word.head_word?.toLowerCase())
    );

    // 6. 取需要的数量
    const selectedWords = newWords.slice(0, limit);

    console.log(`📚 [Vocab] Fetched ${allWords?.length || 0} words, filtered to ${selectedWords.length} new words`);

    if (selectedWords.length === 0) {
        console.log('📚 [Vocab] No new words available (user has learned them all!)');
        return { success: false, error: 'NO_NEW_WORDS' };
    }

    return {
        success: true,
        words: selectedWords,
        bookTitle: book.title
    };
}

