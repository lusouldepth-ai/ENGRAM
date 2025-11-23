'use server';

import OpenAI from 'openai';
import { createClient } from '@/lib/supabase/server';

const client = new OpenAI({
  baseURL: 'https://api.deepseek.com',
  apiKey: process.env.DEEPSEEK_API_KEY,
});

export async function regenerateShadowSentence(cardId: string) {
  try {
    if (!process.env.DEEPSEEK_API_KEY) {
      throw new Error('DEEPSEEK_API_KEY is missing');
    }

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'Unauthorized' };
    }

    const { data: card, error: cardError } = await supabase
      .from('cards')
      .select('id, front, shadow_sentence')
      .eq('id', cardId)
      .eq('user_id', user.id)
      .single();

    if (cardError || !card) {
      return { success: false, error: 'Card not found' };
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('learning_goal')
      .eq('id', user.id)
      .single();

    const goal = profile?.learning_goal || 'Advanced English communication';

    const prompt = `You are an elite shadow-speaking coach.
Word: ${card.front}
Goal context: ${goal}

Generate ONE rhythmic, natural sentence (20-25 words) that uses the word "${card.front}" in a situation directly related to the goal context. 
The sentence should be substantial enough for ~10 seconds of speaking practice.
The sentence should feel like something a native speaker would say when preparing for ${goal}.
Return ONLY the sentence.`;

    const response = await client.chat.completions.create({
      model: 'deepseek-chat',
      messages: [
        { role: 'system', content: 'You craft vivid, rhythmic sentences for language shadowing.' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.9,
    });

    const sentence = response.choices[0].message.content?.trim();

    if (!sentence) {
      return { success: false, error: 'Failed to generate sentence' };
    }

    const { error: updateError } = await supabase
      .from('cards')
      .update({ shadow_sentence: sentence })
      .eq('id', card.id);

    if (updateError) {
      return { success: false, error: 'Failed to update card' };
    }

    return { success: true, sentence };
  } catch (error: any) {
    console.error('Shadow sentence error:', error);
    return { success: false, error: error.message || 'Unexpected error' };
  }
}

