'use server';

import { generateCards } from "./generate-cards";
import { saveCards } from "./save-cards";

export async function quickAddCard(word: string) {
    if (!word || word.trim().length === 0) {
        return { success: false, error: "No word provided" };
    }

    // 1. Generate Card Data
    const genResult = await generateCards(word);

    if (!genResult.success || !genResult.data || genResult.data.length === 0) {
        return { success: false, error: genResult.error || "Failed to generate card" };
    }

    // 2. Save Card
    // We assume the first generated card is the one we want
    const cardToSave = genResult.data[0];
    const saveResult = await saveCards([cardToSave], "Quick Add");

    if (!saveResult.success) {
        return { success: false, error: saveResult.error };
    }

    return { success: true, card: cardToSave };
}
