'use server';

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

/**
 * 获取用户所有的 deck 列表（用于合并选择）
 */
export async function getUserDecks(): Promise<{
    success: boolean;
    decks?: { id: string; title: string; cardCount: number }[];
    error?: string;
}> {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { success: false, error: 'Unauthorized' };
    }

    const { data: decks, error } = await supabase
        .from('decks')
        .select(`
            id,
            title,
            cards:cards(count)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

    if (error) {
        return { success: false, error: error.message };
    }

    const formattedDecks = decks?.map(deck => ({
        id: deck.id,
        title: deck.title,
        cardCount: deck.cards?.[0]?.count || 0
    })) || [];

    return { success: true, decks: formattedDecks };
}

/**
 * 合并多个 deck 到目标 deck
 * - 将源 deck 的卡片移动到目标 deck
 * - 自动去重（相同 front 的卡片只保留一个）
 * - 删除空的源 deck
 */
export async function mergeDecks(
    sourceDeckIds: string[],
    targetDeckId: string
): Promise<{
    success: boolean;
    movedCards: number;
    duplicatesRemoved: number;
    deletedDecks: number;
    error?: string;
}> {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { success: false, movedCards: 0, duplicatesRemoved: 0, deletedDecks: 0, error: 'Unauthorized' };
    }

    // 验证目标 deck 存在且属于用户
    const { data: targetDeck } = await supabase
        .from('decks')
        .select('id, title')
        .eq('id', targetDeckId)
        .eq('user_id', user.id)
        .single();

    if (!targetDeck) {
        return { success: false, movedCards: 0, duplicatesRemoved: 0, deletedDecks: 0, error: '目标卡片组不存在' };
    }

    // 过滤掉目标 deck（防止自己合并到自己）
    const validSourceIds = sourceDeckIds.filter(id => id !== targetDeckId);

    if (validSourceIds.length === 0) {
        return { success: false, movedCards: 0, duplicatesRemoved: 0, deletedDecks: 0, error: '请选择要合并的卡片组' };
    }

    console.log(`🔀 [Merge] Merging ${validSourceIds.length} decks into "${targetDeck.title}"`);

    let totalMovedCards = 0;
    let totalDuplicatesRemoved = 0;
    let deletedDecks = 0;

    // 获取目标 deck 已有的卡片（用于去重）
    const { data: existingCards } = await supabase
        .from('cards')
        .select('front')
        .eq('deck_id', targetDeckId)
        .eq('user_id', user.id);

    const existingFronts = new Set(existingCards?.map(c => c.front.toLowerCase()) || []);

    for (const sourceDeckId of validSourceIds) {
        // 获取源 deck 信息
        const { data: sourceDeck } = await supabase
            .from('decks')
            .select('id, title')
            .eq('id', sourceDeckId)
            .eq('user_id', user.id)
            .single();

        if (!sourceDeck) continue;

        // 获取源 deck 的所有卡片
        const { data: sourceCards } = await supabase
            .from('cards')
            .select('id, front')
            .eq('deck_id', sourceDeckId)
            .eq('user_id', user.id);

        if (!sourceCards || sourceCards.length === 0) {
            // 源 deck 是空的，直接删除
            await supabase
                .from('decks')
                .delete()
                .eq('id', sourceDeckId)
                .eq('user_id', user.id);
            deletedDecks++;
            console.log(`🗑️ [Merge] Deleted empty deck: "${sourceDeck.title}"`);
            continue;
        }

        // 分离重复卡片和非重复卡片
        const duplicateCardIds: string[] = [];
        const cardsToMove: string[] = [];

        for (const card of sourceCards) {
            const frontLower = card.front.toLowerCase();
            if (existingFronts.has(frontLower)) {
                duplicateCardIds.push(card.id);
            } else {
                cardsToMove.push(card.id);
                existingFronts.add(frontLower); // 添加到集合中防止源 deck 内部重复
            }
        }

        // 删除重复卡片
        if (duplicateCardIds.length > 0) {
            await supabase
                .from('cards')
                .delete()
                .in('id', duplicateCardIds)
                .eq('user_id', user.id);
            totalDuplicatesRemoved += duplicateCardIds.length;
            console.log(`🔄 [Merge] Removed ${duplicateCardIds.length} duplicate cards from "${sourceDeck.title}"`);
        }

        // 移动非重复卡片到目标 deck
        if (cardsToMove.length > 0) {
            await supabase
                .from('cards')
                .update({ deck_id: targetDeckId })
                .in('id', cardsToMove)
                .eq('user_id', user.id);
            totalMovedCards += cardsToMove.length;
            console.log(`📦 [Merge] Moved ${cardsToMove.length} cards from "${sourceDeck.title}" to "${targetDeck.title}"`);
        }

        // 删除源 deck
        await supabase
            .from('decks')
            .delete()
            .eq('id', sourceDeckId)
            .eq('user_id', user.id);
        deletedDecks++;
        console.log(`🗑️ [Merge] Deleted source deck: "${sourceDeck.title}"`);
    }

    revalidatePath('/learning-center');

    console.log(`✅ [Merge] Complete: ${totalMovedCards} cards moved, ${totalDuplicatesRemoved} duplicates removed, ${deletedDecks} decks deleted`);

    return {
        success: true,
        movedCards: totalMovedCards,
        duplicatesRemoved: totalDuplicatesRemoved,
        deletedDecks
    };
}
