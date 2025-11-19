
# PED: ENGRAM (Project Core)

**Version:** 1.0.0 (Final)
**Status:** Ready for Development
**Philosophy:** Dieter Rams — "Less but Better"
**Core Metric:** User Memory Retention Rate

---

## 1. 产品定义 (Product Definition)

**ENGRAM** 是一个基于 Gemini 3.0 Pro 驱动的极简主义闪卡学习工具。
它通过“自然语言指令”消除制卡的摩擦力，利用“间隔重复算法”消除遗忘。

*   **Slogan:** Carve it in your mind. (刻于脑海)
*   **视觉风格:** "Digital Braun" — 暖灰底色 (#F4F4F0)、深炭灰文字 (#1A1A1A)、橙色点缀 (#EA580C)。
*   **核心体验:** 像使用 Spotlight 搜索一样简单的制卡体验。

---

## 2. 技术架构 (Tech Stack)

*   **Frontend:** Next.js 14 (App Router), TypeScript, React.
*   **UI System:** Tailwind CSS, Shadcn/UI (Highly Customized to Minimalist Style), Framer Motion (for Flip animations).
*   **Backend / DB:** Supabase (PostgreSQL, Auth, Realtime).
*   **AI Engine:** Google Gemini 3.0 Pro (via Vercel AI SDK).
*   **TTS Engine:** Microsoft Edge TTS (Free, High Quality) or Web Speech API.
*   **State:** Zustand.

---

## 3. 用户旅程与功能 (User Journey)

### 3.1 Phase 1: The Input (极速制卡)
*   **交互:** 全局快捷键 `Cmd+K` 或顶部常驻输入栏。
*   **Prompt:** 用户输入 "Learn IELTS vocabulary from this article: [Paste]" 或 "Create a deck for coffee terminology, US accent".
*   **Logic (Human-in-the-loop):**
    1.  ENGRAM 调用 AI 分析文本。
    2.  返回一个**候选词清单** (Checklist)。
    3.  用户勾选需要记忆的单词（默认全选）。
    4.  点击 "Generate"，系统后台批量生成卡片并存入 Supabase。

### 3.2 Phase 2: The Review (沉浸复习)
*   **交互:** 极简卡片居中。无干扰模式。
*   **正面:** 单词 (Word)。
*   **操作:** 点击卡片或空格键 -> **翻转**。
*   **背面:**
    *   音标 + 自动播放 TTS 发音。
    *   简洁翻译 (User's Native Lang)。
    *   英文释义。
    *   例句 (用于 Shadow Reading)。
*   **反馈 (FSRS Lite):**
    *   Button 1: **Forgot** (Red/Orange) -> 1 min later.
    *   Button 2: **Hard** (Gray) -> 2 days later.
    *   Button 3: **Good** (Green/Dark) -> 4 days later.

---

## 4. 数据库模型 (Supabase Schema)

```sql
-- 1. Users & Quotas
create table profiles (
  id uuid references auth.users not null primary key,
  email text,
  tier text default 'free', -- 'free', 'pro'
  daily_generations int default 0,
  last_reset_date date default current_date,
  created_at timestamptz default now()
);

-- 2. Decks (Collections)
create table decks (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles(id) not null,
  title text not null,
  description text,
  is_preset boolean default false,
  created_at timestamptz default now()
);

-- 3. Cards (The Engrams)
create table cards (
  id uuid default uuid_generate_v4() primary key,
  deck_id uuid references decks(id) on delete cascade not null,
  user_id uuid references profiles(id) not null,
  
  -- Content
  front text not null,
  phonetic text,
  pos text, -- Part of Speech
  translation text,
  definition text,
  example text,
  
  -- SRS Algorithm Data
  state int default 0, -- 0:New, 1:Learning, 2:Review
  due timestamptz default now(),
  stability real default 0,
  difficulty real default 0,
  reps int default 0,
  
  created_at timestamptz default now()
);

-- 4. Activity Logs
create table study_logs (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles(id) not null,
  card_id uuid references cards(id) not null,
  grade int, -- 1:Again, 2:Hard, 3:Good
  reviewed_at timestamptz default now()
);
```

---

## 5. AI System Prompt (Gemini 3.0 Pro)

**Context:** You are the engine behind ENGRAM, a high-end language learning tool.
**Goal:** Extract vocabulary and format it into a strict JSON array.

**Input:** ${user_input}

**Rules:**
1. **Selection:** If input is text, extract the top 15 most valuable/challenging words (CEFR B2+). If input is a list, process the list.
2. **Simplicity:** Definitions must be concise. No fluff. "Less but Better".
3. **Language:** Front=Target Language. Back Translation=User Native. Back Definition=Target Language.

**JSON Output Structure:**
```json
[
  {
    "front": "Serendipity",
    "phonetic": "/ˌser.ənˈdɪp.ə.ti/",
    "pos": "n.",
    "translation": "机缘凑巧",
    "definition": "The occurrence of events by chance in a happy or beneficial way.",
    "example": "We found the restaurant by pure serendipity."
  }
]
```

---

## 6. UI Design Specs (The "Braun" System)

*   **Background:** `#F4F4F0` (Off-white / Paper).
*   **Surface:** `#FFFFFF` (Card) with `border: 1px solid #E5E5E5`.
*   **Primary Text:** `#1A1A1A` (Near Black).
*   **Accent Color:** `#EA580C` (International Orange) - Used ONLY for:
    *   The "Generate" button.
    *   The "Forgot" button action.
    *   Logo dot.
    *   Active state in navigation.
*   **Typography:** `Inter`, tight tracking (-0.02em).
*   **Radius:** `rounded-xl` (12px) for cards, `rounded-full` for buttons.
*   **Motion:** Instant response with subtle fade-ins. No bouncy physics.

---

## 7. 开发计划 (Development Plan)

1.  **Setup:** Initialize Next.js, Tailwind, Supabase. Apply Color Variables.
2.  **Backend:** Run SQL schema in Supabase. Generate Types.
3.  **Feature A (Creator):** Build the Command Bar UI -> Connect to Gemini API -> Display Checklist -> Save to DB.
4.  **Feature B (Reviewer):** Build Flashcard Component -> Flip Logic -> TTS Integration -> SRS Update Logic.
5.  **Polish:** Add Auth pages, Landing page, and Quota limits.
```

---

### 3. Landing Page 更新 (Prototype Snippet)

如果你需要更新原型的 Header 部分，请将原 HTML 中的 Logo SVG 替换为上面新的代码，并将标题改为：

```html
<!-- Title Update -->
<h1 class="text-5xl md:text-6xl font-semibold tracking-tight mb-6 text-[#1A1A1A]">
    ENGRAM
</h1>
<p class="text-lg text-gray-600 leading-relaxed max-w-lg mx-auto">
    Carve knowledge into your mind.<br/>
    AI-powered flashcards. Zero friction.
</p>
```

---
