这是一份为您精心打磨的ENGRAM V2.0 最终执行版 PRD。

我特别针对第三部分（视觉与交互）使用了 Cursor 和前端工程师能直接理解的技术语言 (Technical Spec)，确保“像图书馆一样安静”和“液态水滴番茄钟”的画面能精准落地。

请将此文档保存为 PRD_V2.md，作为下一阶段开发的绝对真理。

PRD V2.0: ENGRAM - The Zen of Memory

Version: 2.0 (Final Execution)
Date: 2025-11-20
Philosophy: "Silence is Golden." (像图书馆一样安静)
Core Experience: Frictionless Onboarding -> Immersion -> Flow.

1. 商业策略与定价 (Pricing Strategy)

定位: High-End Productivity Tool (轻奢工具，拒绝廉价感).
策略: 订阅制 (SaaS Subscription). 拒绝终身买断，保证长期算力可持续。

1.1 订阅方案 (Tiers)

Free Tier (体验版):

限制: 每日 AI 制卡 20 张。

功能: 仅基础 TTS 发音，无高级配置。

Pro Tier (专业版):

价格: 
9.90
/
月
∗
∗
或
∗
∗
9.90/月∗∗或∗∗
99.00 / 年。

权益:

无限 AI 制卡 (Soft Cap: 300/天，防滥用)。

解锁 Neural TTS (逼真神经语音)。

解锁 Shadow Reading (长句跟读模式)。

解锁 "Magic Persona" (多场景配置模板)。

1.2 支付逻辑

MVP阶段: 在 UI 上展示 Pricing 页面，点击按钮暂时弹窗 "Early Access Coming Soon" 或收集邮箱。

下一阶段: 集成 Stripe。

2. 用户引导流程: The "Magic Path" (Onboarding)

目标: 消除“新用户迷茫期”。不教用户怎么用，而是直接带着用户完成第一次价值交付 (TTV = 0)。

2.1 流程图

Sign Up: 用户注册成功。

The Interview (全屏无干扰):

Q1: "Target?" (IELTS / Business / Daily)

Q2: "Level?" (Novice / Pro)

(后台静默动作: 根据选项，调用 DeepSeek 立即生成 5 张“启动卡片”并存入 DB)

The Hook (直接进入复习):

不跳转 Dashboard。

直接跳转到 /review 界面。

用户被迫体验：看词 -> 翻转 -> 听音 -> 评分 (5张卡片)。

The Handoff (交接):

复习完最后一张卡片。

跳转至 /dashboard。

Command Bar 自动聚焦，Placeholder 显示: "Try typing: 'Coffee brewing methods'..."

3. 视觉与交互规范: The "Library" Aesthetic (Technical Specs)

核心指令给 Cursor:

"Implement animations that are 'Liquid & Physical'. No bouncy physics, no 3D flips, no sound effects. The app should feel as quiet as a library."

3.1 复习卡片交互 (The Card Flow)

拒绝: 3D Flip (rotateY), Fly out (x: 1000), Sound Effects.

采用: Fade & Slide (消散与滑动)。

Framer Motion Spec:

code
TypeScript
download
content_copy
expand_less
// Card Transition Definition
const cardVariants = {
  enter: { 
    opacity: 0, 
    scale: 0.95, 
    y: 10, // Slightly float up from bottom
    transition: { duration: 0.3, ease: "easeOut" } 
  },
  center: { 
    opacity: 1, 
    scale: 1, 
    y: 0,
    transition: { duration: 0.3, ease: "easeOut" }
  },
  exit: { 
    opacity: 0, 
    // No aggressive fly-out. Just dissolve.
    // A slight upward drift to symbolize "done".
    y: -20, 
    transition: { duration: 0.2, ease: "easeIn" }
  }
};

// The "Flip" Action
// Do not rotate. Just cross-fade the content instantly or very quickly.
// It should feel like reading the next line of a book, not playing a game.
3.2 视觉锚点: 液态番茄钟 (The Organic Drop)

设计意图: 时间是流动的，不是跳动的数字。避免数字带来的焦虑。

UI 组件: 一个黑色的、有机的液态形状 (Blob/Drop)。

位置: 屏幕右上角或背景正中央 (极低透明度)。

技术实现:

使用 SVG path。

State: progress (0% to 100% of 25 mins).

Animation:

形状随着时间极其缓慢地蠕动 (Morphing)。

随着倒计时结束，形状逐渐“干瘪”或“滴落” (Shape shrinks or moves down)。

Color: #1A1A1A (Ink Black)。

Notification: 时间到时，仅展示一个柔和的系统级 Toast: "Time to breathe."

3.3 声音设计 (Sound Design)

Rule: Global Mute for all UI interactions.

Exception: Only Content has sound.

Word Pronunciation (TTS): Auto-play on card reveal.

Shadow Sentence: Play only on user demand (Click).

Vibe: The app creates a vacuum of silence, allowing the user to focus solely on the language content.

4. 技术实现更新 (Technical Implementation)
4.1 数据库更新 (Run in Supabase SQL)
code
SQL
download
content_copy
expand_less
-- Update Profiles for Onboarding
alter table profiles 
add column learning_goal text,
add column english_level text,
add column onboarding_completed boolean default false;

-- Update Cards for Shadow Reading
alter table cards
add column short_usage text, -- For quick glance
add column shadow_sentence text, -- For deep practice
add column root_analysis text; -- Etymology
4.2 系统提示词更新 (System Prompt)

请在 generate-cards.ts 中使用此 Prompt 以配合新的数据结构：

code
TypeScript
download
content_copy
expand_less
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
  "short_usage": "Short phrase (3-5 words)",
  "shadow_sentence": "Long, rhythmic sentence (10+ words) for speaking practice",
  "root_analysis": "Brief etymology (optional)"
}
`;
5. 开发优先级 (Dev Roadmap)

Step 1: The Magic Onboarding (Priority 0)

实现问卷页面 -> 自动调用 DeepSeek 生成 5 张卡 -> 强制复习流。

这是留住用户的关键。

Step 2: Visual "De-game-ification" (去游戏化)

重写 Flashcard 组件。移除所有 3D 和夸张动画。

实现 "Library Silence" (移除点击音效)。

Step 3: The Organic Timer

开发 LiquidTimer SVG 组件。

Step 4: Pricing Gate

在制卡超过 20 张时，弹出优雅的 Modal 提示订阅。

产品经理备注:
这份文档是 ENGRAM 走向成熟的标志。我们不再是做一个“好玩的 App”，我们是在做一个“严肃的工具”。请告诉 Cursor，严格按照 Section 3 的视觉规范执行代码。Simple is difficult.