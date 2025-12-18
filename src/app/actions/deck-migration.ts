'use server';

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

/**
 * 将旧的卡片组迁移到"我的生词本"
 * 这包括: Starter Deck, Quick Add, 生词本 等
 */
export async function migrateToVocabularyBook(): Promise<{
    success: boolean;
    migratedCards: number;
    deletedDecks: number;
    error?: string;
}> {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { success: false, migratedCards: 0, deletedDecks: 0, error: 'Unauthorized' };
    }

    // 需要合并的旧 deck 名称
    const OLD_DECK_NAMES = ['Starter Deck', 'Quick Add', '生词本', '生成今日5个单词'];

    // 1. 获取或创建"我的生词本"
    let vocabularyDeckId: string;
    const { data: existingDeck } = await supabase
        .from('decks')
        .select('id')
        .eq('user_id', user.id)
        .eq('title', '我的生词本')
        .single();

    if (existingDeck) {
        vocabularyDeckId = existingDeck.id;
    } else {
        const { data: newDeck, error } = await supabase
            .from('decks')
            .insert({
                user_id: user.id,
                title: '我的生词本',
                is_preset: false
            })
            .select('id')
            .single();

        if (error || !newDeck) {
            return { success: false, migratedCards: 0, deletedDecks: 0, error: '创建我的生词本失败' };
        }
        vocabularyDeckId = newDeck.id;
    }

    console.log(`📚 [Migration] Vocabulary book ID: ${vocabularyDeckId}`);

    // 2. 获取所有旧 deck
    const { data: oldDecks } = await supabase
        .from('decks')
        .select('id, title')
        .eq('user_id', user.id)
        .in('title', OLD_DECK_NAMES)
        .neq('id', vocabularyDeckId);

    if (!oldDecks || oldDecks.length === 0) {
        console.log('📚 [Migration] No old decks to migrate');
        revalidatePath('/learning-center');
        return { success: true, migratedCards: 0, deletedDecks: 0 };
    }

    console.log(`📚 [Migration] Found ${oldDecks.length} old decks to migrate`);

    let totalMigratedCards = 0;
    let deletedDecks = 0;

    for (const deck of oldDecks) {
        // 获取旧 deck 中的卡片
        const { data: cards } = await supabase
            .from('cards')
            .select('front')
            .eq('deck_id', deck.id)
            .eq('user_id', user.id);

        if (cards && cards.length > 0) {
            // 将卡片移动到"我的生词本"
            const { error: moveError } = await supabase
                .from('cards')
                .update({ deck_id: vocabularyDeckId })
                .eq('deck_id', deck.id)
                .eq('user_id', user.id);

            if (!moveError) {
                totalMigratedCards += cards.length;
                console.log(`📚 [Migration] Moved ${cards.length} cards from "${deck.title}" to 我的生词本`);
            }
        }

        // 删除空的旧 deck
        const { error: deleteError } = await supabase
            .from('decks')
            .delete()
            .eq('id', deck.id)
            .eq('user_id', user.id);

        if (!deleteError) {
            deletedDecks++;
            console.log(`🗑️ [Migration] Deleted old deck: "${deck.title}"`);
        }
    }

    revalidatePath('/learning-center');

    return {
        success: true,
        migratedCards: totalMigratedCards,
        deletedDecks
    };
}

/**
 * 创建或确保"我的错词本"存在
 */
export async function ensureMistakeBook(): Promise<{
    success: boolean;
    deckId?: string;
    error?: string;
}> {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { success: false, error: 'Unauthorized' };
    }

    const { data: existingDeck } = await supabase
        .from('decks')
        .select('id')
        .eq('user_id', user.id)
        .eq('title', '我的错词本')
        .single();

    if (existingDeck) {
        return { success: true, deckId: existingDeck.id };
    }

    const { data: newDeck, error } = await supabase
        .from('decks')
        .insert({
            user_id: user.id,
            title: '我的错词本',
            is_preset: false
        })
        .select('id')
        .single();

    if (error || !newDeck) {
        return { success: false, error: '创建我的错词本失败' };
    }

    revalidatePath('/learning-center');
    return { success: true, deckId: newDeck.id };
}
