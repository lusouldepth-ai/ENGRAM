'use server';

import OpenAI from 'openai';
import { createClient } from '@/lib/supabase/server';

const client = new OpenAI({
    baseURL: 'https://api.deepseek.com',
    apiKey: process.env.DEEPSEEK_API_KEY,
    timeout: 15000,
    maxRetries: 1,
});

/**
 * 检测文本是否主要包含中文字符
 */
function containsChinese(text: string): boolean {
    if (!text) return false;
    // 匹配中文字符（包括中文标点）
    const chineseRegex = /[\u4e00-\u9fff\u3400-\u4dbf]/;
    return chineseRegex.test(text);
}

/**
 * 检测文本是否主要是英文
 */
function isMainlyEnglish(text: string): boolean {
    if (!text) return false;
    // 移除标点和空格后，检查是否主要是英文字母
    const cleaned = text.replace(/[^a-zA-Z\u4e00-\u9fff]/g, '');
    if (cleaned.length === 0) return false;
    const englishChars = cleaned.replace(/[\u4e00-\u9fff]/g, '').length;
    return englishChars / cleaned.length > 0.7;
}

/**
 * 检测单张卡片的翻译是否需要修复
 */
export async function checkCardTranslation(cardId: string): Promise<{
    needsFix: boolean;
    currentTranslation: string;
    expectedLanguage: 'cn' | 'en';
}> {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { needsFix: false, currentTranslation: '', expectedLanguage: 'cn' };
    }

    // 获取用户的 ui_language 设置
    const { data: profile } = await supabase
        .from('profiles')
        .select('ui_language')
        .eq('id', user.id)
        .single();

    const expectedLanguage = (profile?.ui_language === 'en' ? 'en' : 'cn') as 'cn' | 'en';

    // 获取卡片翻译
    const { data: card } = await supabase
        .from('cards')
        .select('translation')
        .eq('id', cardId)
        .eq('user_id', user.id)
        .single();

    if (!card?.translation) {
        return { needsFix: false, currentTranslation: '', expectedLanguage };
    }

    const translation = card.translation;

    // 检测当前翻译语言是否正确
    let needsFix = false;
    if (expectedLanguage === 'cn') {
        // 期望中文，但翻译主要是英文
        needsFix = !containsChinese(translation) && isMainlyEnglish(translation);
    } else {
        // 期望英文，但翻译包含中文
        needsFix = containsChinese(translation);
    }

    return { needsFix, currentTranslation: translation, expectedLanguage };
}

/**
 * 修复单张卡片的翻译
 */
export async function fixCardTranslation(cardId: string): Promise<{
    success: boolean;
    oldTranslation?: string;
    newTranslation?: string;
    error?: string;
}> {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { success: false, error: 'Unauthorized' };
    }

    // 获取用户设置和卡片信息
    const { data: profile } = await supabase
        .from('profiles')
        .select('ui_language')
        .eq('id', user.id)
        .single();

    const targetLanguage = profile?.ui_language === 'en' ? 'English' : '中文';

    const { data: card } = await supabase
        .from('cards')
        .select('front, translation, definition')
        .eq('id', cardId)
        .eq('user_id', user.id)
        .single();

    if (!card) {
        return { success: false, error: 'Card not found' };
    }

    console.log(`🔧 [TranslationFix] Fixing translation for "${card.front}": "${card.translation}" -> ${targetLanguage}`);

    try {
        // 使用 AI 生成正确语言的翻译
        const response = await client.chat.completions.create({
            model: 'deepseek-chat',
            messages: [
                {
                    role: 'system',
                    content: `你是一个翻译专家。将英语单词的释义翻译成${targetLanguage}。只输出翻译结果，不要任何其他内容。`
                },
                {
                    role: 'user',
                    content: `单词: ${card.front}\n当前释义: ${card.definition || card.translation}\n请提供${targetLanguage}翻译:`
                }
            ],
            temperature: 0.3,
            max_tokens: 100,
        });

        const newTranslation = response.choices[0].message.content?.trim();

        if (!newTranslation) {
            return { success: false, error: 'AI returned empty translation' };
        }

        // 更新数据库
        const { error: updateError } = await supabase
            .from('cards')
            .update({ translation: newTranslation })
            .eq('id', cardId)
            .eq('user_id', user.id);

        if (updateError) {
            return { success: false, error: updateError.message };
        }

        console.log(`✅ [TranslationFix] Fixed: "${card.translation}" -> "${newTranslation}"`);

        return {
            success: true,
            oldTranslation: card.translation || '',
            newTranslation,
        };
    } catch (error: any) {
        console.error('❌ [TranslationFix] Error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * 批量检查并修复用户所有卡片的翻译
 */
export async function fixAllCardTranslations(): Promise<{
    success: boolean;
    fixed: number;
    failed: number;
    total: number;
    error?: string;
}> {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { success: false, fixed: 0, failed: 0, total: 0, error: 'Unauthorized' };
    }

    // 获取用户设置
    const { data: profile } = await supabase
        .from('profiles')
        .select('ui_language')
        .eq('id', user.id)
        .single();

    const expectedChinese = profile?.ui_language !== 'en';

    // 获取所有卡片
    const { data: cards, error: fetchError } = await supabase
        .from('cards')
        .select('id, front, translation')
        .eq('user_id', user.id);

    if (fetchError || !cards) {
        return { success: false, fixed: 0, failed: 0, total: 0, error: fetchError?.message || 'Failed to fetch cards' };
    }

    // 筛选需要修复的卡片
    const cardsToFix = cards.filter(card => {
        if (!card.translation) return false;
        if (expectedChinese) {
            return !containsChinese(card.translation) && isMainlyEnglish(card.translation);
        } else {
            return containsChinese(card.translation);
        }
    });

    console.log(`🔍 [TranslationFix] Found ${cardsToFix.length}/${cards.length} cards needing fix`);

    let fixed = 0;
    let failed = 0;

    // 逐个修复（避免 API 限流）
    for (const card of cardsToFix) {
        const result = await fixCardTranslation(card.id);
        if (result.success) {
            fixed++;
        } else {
            failed++;
            console.error(`Failed to fix card ${card.front}: ${result.error}`);
        }
        // 添加小延迟避免 API 限流
        await new Promise(resolve => setTimeout(resolve, 200));
    }

    return {
        success: true,
        fixed,
        failed,
        total: cardsToFix.length,
    };
}
