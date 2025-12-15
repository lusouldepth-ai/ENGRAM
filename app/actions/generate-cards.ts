'use server';

import OpenAI from 'openai';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

const client = new OpenAI({
  baseURL: 'https://api.deepseek.com',
  apiKey: process.env.DEEPSEEK_API_KEY,
  timeout: 30000, // 30秒超时
  maxRetries: 1,  // 最多重试1次
});

type GenerateContext = {
  level?: string;
  goal?: string;
  ui_language?: string;
}

// CEFR 词汇标准定义 - 用于指导 AI 生成正确难度的词汇
const CEFR_VOCABULARY_GUIDE: Record<string, {
  wordCount: string;
  frequency: string;
  characteristics: string;
  examples: string;
}> = {
  // A1 - 入门级
  'beginner': {
    wordCount: '约500个核心词汇',
    frequency: '英语最高频500词（Oxford 3000中最基础部分）',
    characteristics: '日常生活最基本词汇：数字、颜色、家庭成员、基本动词（be, have, do, go, eat, drink）、常见名词（house, car, book）',
    examples: 'hello, thank you, please, water, food, family, work, school, good, bad, big, small'
  },
  // A2 - 初级
  'elementary': {
    wordCount: '约1000-1500个词汇',
    frequency: '英语高频1500词（Oxford 3000基础部分）',
    characteristics: '简单日常交流词汇：购物、旅行、描述人物和地点、表达简单观点、基本形容词和副词',
    examples: 'appointment, schedule, recommend, comfortable, convenient, experience, improve, similar, although'
  },
  // B1 - 中级
  'intermediate': {
    wordCount: '约2500-3000个词汇',
    frequency: '英语中高频词汇（Oxford 3000完整 + 部分5000）',
    characteristics: '工作和学习常用词汇：表达观点、讨论话题、描述经历、抽象概念入门',
    examples: 'perspective, significant, analyze, establish, regarding, circumstances, furthermore, consequently'
  },
  // B2 - 中高级
  'upper_intermediate': {
    wordCount: '约4000-5000个词汇',
    frequency: '英语学术和专业词汇（Oxford 5000 + AWL学术词表）',
    characteristics: '复杂讨论和专业场景：学术写作、正式场合、抽象概念、细微差别表达',
    examples: 'constitute, inherent, paradigm, substantial, coherent, comprehensive, unprecedented, implications'
  },
  // C1 - 高级
  'advanced': {
    wordCount: '约6000-8000个词汇',
    frequency: '高级学术和专业词汇',
    characteristics: '接近母语水平：复杂学术论文、专业领域深度讨论、成语和习语、文学表达',
    examples: 'concomitant, elucidate, juxtapose, ostensible, propensity, quintessential, albeit, notwithstanding'
  }
};

export async function generateCards(input: string, context?: GenerateContext, limit: number = 5) {
  console.log("🚀 [Action] Starting generation for:", input.substring(0, 20) + "...", context, "Limit:", limit);

  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Unauthorized" };
    }

    // CHECK QUOTA
    // First check if user is PRO
    const { data: profile } = await supabase
      .from('profiles')
      .select('tier')
      .eq('id', user.id)
      .single();

    const isPro = profile?.tier === 'pro';

    if (!isPro) {
      const { data: hasQuota, error: rpcError } = await supabase
        .rpc('check_daily_quota', { user_uuid: user.id });

      if (rpcError) {
        console.error("Quota check error:", rpcError);
        return { success: false, error: "Failed to check quota." };
      }

      if (hasQuota === false) {
        return { success: false, error: "QUOTA_EXCEEDED" };
      }
    }

    if (!process.env.DEEPSEEK_API_KEY) {
      throw new Error("DEEPSEEK_API_KEY is missing in .env.local");
    }

    // Fetch user context if not provided
    let level = context?.level || "Intermediate";
    let goal = context?.goal || "General English";
    let ui_language = context?.ui_language || "cn";

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

    // 获取 CEFR 词汇指南
    const cefrGuide = CEFR_VOCABULARY_GUIDE[level] || CEFR_VOCABULARY_GUIDE['intermediate'];

    const systemPrompt = `你是一位专业的英语词汇教育专家，精通 CEFR 标准。

## 学习者档案
- 学习目标：${goal}
- 英语水平：${level}
- 主题输入：${input}

## CEFR 词汇标准（必须严格遵守！）
当前用户水平对应的词汇要求：
- 词汇量范围：${cefrGuide.wordCount}
- 词频标准：${cefrGuide.frequency}
- 词汇特征：${cefrGuide.characteristics}
- 难度参考示例：${cefrGuide.examples}

## 任务
生成恰好 ${limit} 个词汇卡片。

## 严格规则
1. **词汇难度必须匹配**：所有词汇必须在 ${cefrGuide.frequency} 范围内，不能超出用户水平！
2. **场景相关性**：词汇必须与 ${goal} 高度相关
3. **例句难度匹配**：例句也必须符合用户水平，使用简单句式
4. **不要太简单也不要太难**：参考上述难度示例

## 输出格式（JSON数组，无markdown）
[{
  "front": "单词",
  "phonetic": "/音标/",
  "pos": "词性",
  "translation": "${ui_language === 'cn' ? '中文释义' : 'English definition'}",
  "definition": "英文解释（符合${level}水平的简单解释）",
  "example": "简短例句（10词以内，适合听写）",
  "short_usage": "常用搭配（3-6词）",
  "shadow_sentence": "跟读句子（12-15词，与${goal}相关）",
  "shadow_sentence_translation": "上述跟读句子的中文翻译",
  "root_analysis": "词根词源"
}]

只输出JSON数组，不要任何其他文字。`;

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
