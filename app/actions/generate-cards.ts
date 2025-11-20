'use server';

import OpenAI from 'openai';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

const client = new OpenAI({
  baseURL: 'https://api.deepseek.com',
  apiKey: process.env.DEEPSEEK_API_KEY,
});

type GenerateContext = {
    level?: string;
    goal?: string;
    ui_language?: string;
}

export async function generateCards(input: string, context?: GenerateContext) {
  console.log("🚀 [Action] Starting generation for:", input.substring(0, 20) + "...", context);

  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { success: false, error: "Unauthorized" };
    }

    // CHECK QUOTA
    const { data: hasQuota, error: rpcError } = await supabase
        .rpc('check_daily_quota', { user_uuid: user.id });
    
    if (rpcError) {
        console.error("Quota check error:", rpcError);
        // Fallback: Allow if error? Or Block? Block to be safe.
        return { success: false, error: "Failed to check quota." };
    }

    if (hasQuota === false) {
        // Quota exceeded
        return { success: false, error: "QUOTA_EXCEEDED" };
    }

    if (!process.env.DEEPSEEK_API_KEY) {
      throw new Error("DEEPSEEK_API_KEY is missing in .env.local");
    }

    // Fetch user context if not provided
    let level = context?.level || "Intermediate";
    let goal = context?.goal || "General English";
    let ui_language = context?.ui_language || "en";

    if (!context) {
        const { data: profile } = await supabase
            .from('profiles')
            .select('english_level, learning_goal, ui_language')
            .eq('id', user.id)
            .single();
        
        if (profile) {
            level = profile.english_level || level;
            goal = profile.learning_goal || goal;
            ui_language = profile.ui_language || ui_language;
        }
    }

    const systemPrompt = `
You are an elite language coach.
Target learner profile:
- Goal: ${goal}
- Level: ${level}
- Input theme from user: ${input}

Mission:
- Generate exactly 5 vocabulary cards that are CRITICAL for the goal above.
- Every card must feel handcrafted for this target. Avoid generic textbook words.
- Think about the scenarios this learner will face (presentations, essays, speaking tests, etc.).

For each card, return JSON matching our cards table schema:
{
  "front": "Word",
  "phonetic": "/ipa/",
  "pos": "n./v.",
  "translation": "Definition (Language: ${ui_language === 'cn' ? 'Chinese' : 'English'})",
  "definition": "Explain the word in clear English. Provide nuance relevant to ${goal}.",
  "example": "sentence_standard – short, direct usage that proves understanding.",
  "short_usage": "3-6 word collocation or phrase.",
  "shadow_sentence": "12-15 word rhythmic sentence tied to ${goal}. Feels like native speech for shadowing.",
  "root_analysis": "Origins / morphology insight."
}

Rules:
1. The shadow_sentence MUST reference the theme of ${goal}.
2. The example sentence must be simple (dictation friendly).
3. Never repeat the same scenario twice; diversify contexts tied to the goal.
4. Output ONLY a valid JSON array of 5 objects. No markdown. No prose.
`;

    const response = await client.chat.completions.create({
      model: 'deepseek-chat',
      messages: [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: input
        }
      ],
      temperature: 1.0,
    });

    const content = response.choices[0].message.content || "[]";
    console.log("📩 [Action] Raw AI Response:", content);

    // 清洗数据：去掉可能存在的 Markdown 符号
    const cleanedContent = content.replace(/```json|```/g, '').trim();
    
    // 解析 JSON
    const cards = JSON.parse(cleanedContent);
    console.log(`✅ [Action] Successfully parsed ${cards.length} cards.`);

    return { success: true, data: cards };

  } catch (error: any) {
    console.error("❌ [Action] Error:", error);
    return { success: false, error: error.message || "Failed to generate cards" };
  }
}
