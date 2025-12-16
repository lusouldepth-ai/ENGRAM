'use server';

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

/**
 * 删除单张卡片
 */
export async function deleteCard(cardId: string): Promise<{
    success: boolean;
    error?: string;
}> {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { success: false, error: "Unauthorized" };
    }

    // 验证卡片属于当前用户
    const { data: card } = await supabase
        .from('cards')
        .select('id, deck_id')
        .eq('id', cardId)
        .eq('user_id', user.id)
        .single();

    if (!card) {
        return { success: false, error: "Card not found" };
    }

    // 删除卡片
    const { error } = await supabase
        .from('cards')
        .delete()
        .eq('id', cardId)
        .eq('user_id', user.id);

    if (error) {
        console.error("Delete card error:", error);
        return { success: false, error: error.message };
    }

    console.log(`🗑️ [Card] Deleted card ${cardId}`);

    // 刷新页面缓存
    revalidatePath('/learning-center');
    revalidatePath(`/learning-center/deck/${card.deck_id}`);

    return { success: true };
}

/**
 * 删除整个卡片组（包括其中所有卡片）
 */
export async function deleteDeck(deckId: string): Promise<{
    success: boolean;
    error?: string;
}> {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { success: false, error: "Unauthorized" };
    }

    // 验证卡片组属于当前用户
    const { data: deck } = await supabase
        .from('decks')
        .select('id, title')
        .eq('id', deckId)
        .eq('user_id', user.id)
        .single();

    if (!deck) {
        return { success: false, error: "Deck not found" };
    }

    // 先删除卡片组中的所有卡片
    const { error: cardsError } = await supabase
        .from('cards')
        .delete()
        .eq('deck_id', deckId)
        .eq('user_id', user.id);

    if (cardsError) {
        console.error("Delete cards error:", cardsError);
        return { success: false, error: cardsError.message };
    }

    // 再删除卡片组
    const { error: deckError } = await supabase
        .from('decks')
        .delete()
        .eq('id', deckId)
        .eq('user_id', user.id);

    if (deckError) {
        console.error("Delete deck error:", deckError);
        return { success: false, error: deckError.message };
    }

    console.log(`🗑️ [Deck] Deleted deck "${deck.title}" (${deckId})`);

    // 刷新页面缓存
    revalidatePath('/learning-center');

    return { success: true };
}
