'use server';

import OpenAI from 'openai';

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
    if (!process.env.DEEPSEEK_API_KEY) {
      throw new Error("DEEPSEEK_API_KEY is missing in .env.local");
    }

    const level = context?.level || "Intermediate";
    const goal = context?.goal || "General English";
    const ui_language = context?.ui_language || "en";

    // 核心差异化: 根据 UI Language 调整 Definition 的语言倾向
    // PRD Requirement: "CN 模式下，Definition 偏向提供中文释义；EN 模式下，提供英英释义"
    // Note: Translation field is usually for L1 (User's native language), but here we follow PRD.
    // If ui_language is 'cn', Translation is Chinese.
    // If ui_language is 'en', Translation could be ...? PRD says "Translation (Language: ${ui_language})"
    // Let's stick to the prompt structure in PRD V3.

    const systemPrompt = `
Role: Expert Linguist.
Task: Generate flashcard data in STRICT JSON.
Context: User Level: ${level}, Goal: ${goal}.

JSON Structure:
{
  "front": "Word",
  "phonetic": "/ipa/",
  "pos": "n./v.",
  "translation": "Definition (Language: ${ui_language === 'cn' ? 'Chinese' : 'English'})",
  "definition": "English Definition",
  "short_usage": "Short phrase (3-6 words) for quick reading",
  "shadow_sentence": "Long, rhythmic sentence (10-15 words) for shadowing practice",
  "root_analysis": "Etymology breakdown"
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
