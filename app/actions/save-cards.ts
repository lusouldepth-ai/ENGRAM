'use server';

import { createClient } from "@/lib/supabase/server";

export type CardData = {
  front: string;
  phonetic?: string;
  pos?: string;
  translation?: string;
  definition?: string;
  example?: string;
};

export async function saveCards(cards: CardData[], deckTitle: string = "Generated Deck") {
  const supabase = createClient();

  // 1. Get User
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  
  if (userError || !user) {
     // For development/demo without auth, we might want to handle this differently.
     // But strict implementation requires user.
     // We will return error.
     return { success: false, error: "User not authenticated" };
  }

  // 2. Create Profile if not exists (idempotent check usually needed, or triggers)
  // Assuming profile exists or triggers create it. 
  // But for safety in this demo, let's just assume user exists.

  try {
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

    if (deckError) throw new Error(deckError.message);

    // 4. Prepare Cards
    const cardsToInsert = cards.map(card => ({
      deck_id: deck.id,
      user_id: user.id,
      front: card.front,
      phonetic: card.phonetic,
      pos: card.pos,
      translation: card.translation,
      definition: card.definition,
      example: card.example,
      state: 0, // New
      due: new Date().toISOString(), // Now
      reps: 0,
      stability: 0,
      difficulty: 0
    }));

    // 5. Insert Cards
    const { error: cardsError } = await supabase
      .from('cards')
      .insert(cardsToInsert);

    if (cardsError) throw new Error(cardsError.message);

    return { success: true, deckId: deck.id };

  } catch (error: any) {
    console.error("Error saving cards:", error);
    return { success: false, error: error.message };
  }
}

