PRD: ENGRAM - The Intelligent Zen (V3.0)
Version: 3.0 (Final Execution)
Date: 2025-11-20
Product Owner: Ma Sanye & Co.
Core Philosophy: "Silence is Golden." (极致安静，数据深度)
Platform: Web Only (Desktop/Tablet optimized).
1. 商业策略与配额 (Pricing & Quota)
策略: Freemium Hook Strategy (先尝后买，习惯养成)。
1.1 配额逻辑 (The Hook)
新用户蜜月期: 注册后 24小时内，免费制卡额度 20张。
常态限制: 24小时后，降级为 5张/天。
心理学: 5张不足以满足严肃学习者的需求，制造痛点倒逼转化。
数据重置: 每日 00:00 (UTC) 重置配额。
1.2 订阅方案 (Pro)
定价: 
9.90
/
月
∗
∗
或
∗
∗
$9.90/月∗∗或∗∗
$99.00 / 年。
权益:
无限 AI 制卡 (Soft Cap: 300/天)。
解锁所有学习模式 (拼写模式、跟读模式)。
解锁神经元语音 (Neural TTS)。
动态学习计划调整。
2. 国际化架构 (I18n Architecture)
目标: 支持中/英双语，服务全球用户。
2.1 切换交互
位置: 导航栏 (Navbar) 右侧。
组件: iOS 风格 Toggle Switch。
EN: 背景橙色 (#EA580C)，滑块在右。
CN: 背景灰色 (#E5E5E5)，滑块在左。
逻辑:
切换 UI 语言。
关键: 切换 AI 生成内容的语言倾向（如：CN 模式下，Definition 偏向提供中文释义；EN 模式下，提供英英释义）。
3. 用户旅程: The Magic Path (Onboarding)
目标: 零摩擦引导 -> 惊艳时刻 -> 锁定习惯。
3.1 注册与背景调查 (The Interview)
注册成功后，进入全屏无干扰表单：
Identity: Student / Professional / Traveler.
Target: IELTS / Business / Daily. (若选考试，追问目标分数与日期)。
Level: Novice / Intermediate / Advanced.
Accent: American / British.
Logic: 数据存入 profiles 表，生成初始 daily_goal (默认20)。
3.2 智能计划 (The Plan)
算法: 根据 Goal 和 Exam Date 计算。
Display: "To reach IELTS 7.0, master 20 words/day."
动态性: 若用户昨日未完成，今日目标自动微调（+2词），或提示延后完成日期。
3.3 惊艳时刻 (The Wow Moment)
Action: 系统自动调用 DeepSeek 生成 5 张 贴合用户背景的卡片。
Experience: 强制进入复习界面，体验 5 张卡片。
Celebration:
完成第 5 张后。
视觉: Paper Confetti (纸屑雨)。橙/白两色矩形纸片从顶部飘落。无音效。
文案: "First step taken. Your plan is ready."
Redirect: 跳转至 Dashboard。
4. 核心功能：个性化制卡与模式 (Creator & Modes)
核心逻辑: AI 生成全量数据，前端根据 deck_mode 渲染不同 UI。
4.1 智能制卡 (Command Bar)
输入: 自然语言 (e.g., "IELTS writing vocabulary, Band 7+").
AI 处理: DeepSeek V3 生成 JSON。
Review List: 用户勾选。
"I know this" -> 存入 DB，初始间隔 30 天。
"Learn" -> 存入 DB，初始间隔 0 天。
4.2 学习模式 (Learning Modes) - 核心差异化
用户可在 Dashboard 或 Deck 设置中切换模式。
A. Reader Mode (默认 - 禅意阅读)
场景: 快速记忆，通勤。
Front: 单词 + 音标。
Back: 释义 + 短例句 + 自动播放 TTS。
交互: Space 翻页，1/2/3 评分。
B. Speller Mode (拼写模式 - 强记忆)
场景: PC 端深度记忆，纠正拼写。
Front:
隐藏单词。
显示: 音标 + 词性 + 输入框。
自动播放发音。
Interaction:
用户输入 -> 回车。
Feedback (Diff Highlighting):
正确: 输入框变绿，显示单词。
错误: 错误字母高亮橙色，下方显示正确拼写。
Logic: 强制判为 "Hard" 或 "Forgot"。
C. Speaker Mode (跟读模式 - 口语训练)
场景: 备考口语，纠正发音。
Front: 单词。
Back:
显示 Long Shadow Sentence (长例句)。
UI: 播放原声按钮 (慢速/常速) + 录音按钮。
Action: 按住录音 -> 松开回放 -> 对比原声。
5. 核心功能：沉浸式复习 (Zen Reviewer)
5.1 视觉规范 (Visuals)
Layout: 全屏，无 Navbar。左上角极小 "Exit"。
Timer: 右上角 Liquid Timer (液态番茄钟)。
黑色有机液滴，随时间流逝缓慢变形、收缩。
Animation (Physics):
Flip: 拒绝 3D 旋转。使用 Fade & Slide Up (内容上滑浮现)。
Next Card: 当前卡片 Dissolve & Float Up (消散上浮)，下一张卡片 Appear (原地显现)。
Sound: 全局静音 (无 UI 音效)，仅保留 TTS 人声。
5.2 算法逻辑 (SRS)
Engine: FSRS / Simplified SM-2.
Queue: 优先显示 due 卡片，其次显示 new 卡片。
Completion: 完成今日目标后，显示 "All Caught Up" 及进度环。
6. 技术架构与数据库 (Tech & Schema)
6.1 技术栈
Frontend: Next.js 14, Tailwind CSS, Framer Motion.
AI: DeepSeek V3 (via OpenAI SDK openai).
DB: Supabase (PostgreSQL).
TTS: Microsoft Edge TTS (via edge-tts library on server action) or Web Speech API (Client fallback).
6.2 数据库模型更新 (SQL)
请将此 SQL 发送给 Cursor 执行：
code
SQL
-- 1. Profiles (User Settings & Plan)
alter table profiles 
add column learning_goal text,
add column target_score text,
add column exam_date date,
add column english_level text,
add column accent_preference text default 'US', -- 'US' or 'UK'
add column daily_goal int default 20,
add column ui_language text default 'en',
add column plan_status jsonb; -- Stores dynamic plan data

-- 2. Decks (Learning Configuration)
alter table decks
add column view_mode text default 'reader'; -- 'reader', 'speller', 'speaker'

-- 3. Cards (Rich Content)
alter table cards
add column short_usage text, -- For Reader Mode
add column shadow_sentence text, -- For Speaker Mode
add column root_analysis text, -- Etymology
add column is_mastered boolean default false;
6.3 System Prompt 规范
AI 必须一次性生成满足所有模式的数据：
code
TypeScript
const systemPrompt = `
Role: Expert Linguist.
Task: Generate flashcard data in STRICT JSON.
Context: User Level: ${level}, Goal: ${goal}.

JSON Structure:
{
  "front": "Word",
  "phonetic": "/ipa/",
  "pos": "n./v.",
  "translation": "Definition (Language: ${ui_language})",
  "definition": "English Definition",
  "short_usage": "Short phrase (3-6 words) for quick reading",
  "shadow_sentence": "Long, rhythmic sentence (10-15 words) for shadowing practice",
  "root_analysis": "Etymology breakdown"
}
`;
7. 开发执行路线 (Execution Roadmap)
Phase 1: The Foundation (基础)
DB Update: 执行上述 SQL。
I18n: 配置 Next-intl，实现中英切换。
Auth & Onboarding: 实现全屏问卷与“惊艳时刻”流程。
Phase 2: The Engine (核心)
AI Creator: 重构 generate-cards.ts，接入 DeepSeek，支持全量字段生成。
Reviewer Logic: 实现 FSRS 调度算法。
Phase 3: The Experience (体验)
Visuals: 开发 LiquidTimer 和 Fade/Slide 动画。
Modes: 开发 SpellerCard (拼写组件) 和 SpeakerCard (录音组件)。
Landing: 部署最终版 Landing Page。