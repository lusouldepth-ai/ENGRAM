'use server';

import { createClient } from "@/lib/supabase/server";

export type CardData = {
  front: string;
  phonetic?: string;
  pos?: string;
  translation?: string;
  definition?: string;
  example?: string;
  short_usage?: string;
  shadow_sentence?: string;
  root_analysis?: string;
};

export async function saveCards(cards: CardData[], deckTitle: string = "Generated Deck") {
  const supabase = createClient();

  try {
    // 1. Get User with strict check
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error("Auth Error:", authError);
      return { success: false, error: "Unauthorized: Please log in to save cards." };
    }

    console.log(`🚀 Saving ${cards.length} cards for user ${user.id} to deck "${deckTitle}"`);

    // 2. Ensure Profile Exists (Safety Check)
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .single();

    if (!profile) {
      console.log("⚠️ Profile missing, creating one...");
      await supabase.from('profiles').insert({ id: user.id, email: user.email });
    }

    // 3. Create Deck
    const { data: deck, error: deckError } = await supabase
      .from('decks')
      .insert({
        user_id: user.id,
        title: deckTitle,
        is_preset: false
      })
      .select()
      .single();

    if (deckError) {
      console.error("Deck Creation Error:", deckError);
      throw new Error(`Failed to create deck: ${deckError.message}`);
    }

    // 4. Insert Cards
    const cardsToInsert = cards.map(card => ({
      deck_id: deck.id,
      user_id: user.id,
      front: card.front,
      phonetic: card.phonetic || "",
      pos: card.pos || "",
      translation: card.translation || "",
      definition: card.definition || "",
      example: card.example || "",
      short_usage: card.short_usage || "",
      shadow_sentence: card.shadow_sentence || "",
      root_analysis: card.root_analysis || "",
      state: 0, // 0: New
      due: new Date().toISOString(), // Immediately due
      reps: 0,
      stability: 0,
      difficulty: 0
    }));

    const { error: cardsError } = await supabase
      .from('cards')
      .insert(cardsToInsert);

    if (cardsError) {
      console.error("Card Insertion Error:", cardsError);
      throw new Error(`Failed to save cards: ${cardsError.message}`);
    }

    console.log("✅ Cards saved successfully");
    return { success: true, deckId: deck.id };

  } catch (error: any) {
    console.error("❌ Save Action Failed:", error);
    return { success: false, error: error.message || "Unknown error occurred" };
  }
}
