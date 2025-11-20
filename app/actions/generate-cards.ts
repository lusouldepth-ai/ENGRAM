'use server';

import OpenAI from 'openai';

const client = new OpenAI({
  baseURL: 'https://api.deepseek.com',
  apiKey: process.env.DEEPSEEK_API_KEY,
});

type GenerateContext = {
    level?: string;
    goal?: string;
}

export async function generateCards(input: string, context?: GenerateContext) {
  console.log("🚀 [Action] Starting generation for:", input.substring(0, 20) + "...", context);

  try {
    if (!process.env.DEEPSEEK_API_KEY) {
      throw new Error("DEEPSEEK_API_KEY is missing in .env.local");
    }

    const level = context?.level || "Intermediate";
    const goal = context?.goal || "General English";

    const systemPrompt = `
Role: Expert Linguist.
Task: Extract vocabulary and output STRICT JSON Array.
Context: User Level: ${level}, Goal: ${goal}.

JSON Structure:
{
  "front": "Word",
  "phonetic": "/ipa/",
  "pos": "n./v.",
  "translation": "Chinese Meaning",
  "definition": "English Definition",
  "example": "Example sentence",
  "short_usage": "Short phrase (3-5 words)",
  "shadow_sentence": "Long, rhythmic sentence (10+ words) for speaking practice",
  "root_analysis": "Brief etymology (optional)"
}

Output ONLY valid JSON array. No markdown.
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
