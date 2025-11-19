'use server';

import OpenAI from 'openai';

// 初始化官方 SDK
// DeepSeek 完全兼容 OpenAI 协议
const client = new OpenAI({
  baseURL: 'https://api.deepseek.com', // 官方 SDK 会自动补全 /v1/chat/completions
  apiKey: process.env.DEEPSEEK_API_KEY, // 确保 .env.local 里叫这个名字
});

export async function generateCards(input: string) {
  console.log("🚀 [Action] Starting generation for:", input.substring(0, 20) + "...");

  try {
    if (!process.env.DEEPSEEK_API_KEY) {
      throw new Error("DEEPSEEK_API_KEY is missing in .env.local");
    }

    const response = await client.chat.completions.create({
      model: 'deepseek-chat',
      messages: [
        {
          role: 'system',
          content: `You are an expert linguist.
          Extract vocabulary from the user input.
          Output STRICT JSON only. No markdown. No code blocks.
          Format: [{"front": "Word", "translation": "中文释义", "definition": "English Definition", "phonetic": "/ipa/", "pos": "n.", "example": "Example sentence."}]`
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

    // Return object with success property to match component expectation
    return { success: true, data: cards };

  } catch (error: any) {
    console.error("❌ [Action] Error:", error);
    // 返回错误对象防止前端崩溃
    return { success: false, error: error.message || "Failed to generate cards" };
  }
}
