PRD: ENGRAM - 智能之禅 (V3.1)

版本: 3.1 (Final Execution)
日期: 2025-11-20
核心哲学: "Less, but better." (将功能隐于无形)
技术栈: Next.js 14 (App Router), Supabase, Tailwind CSS, Framer Motion, DeepSeek V3.

1. 商业策略与定价 (Business & Pricing)

1.1 配额策略 (Quota Logic)

Hook (蜜月期): 注册 < 24小时，每日限额 20 卡。

Habit (常态期): 注册 > 24小时，每日限额 5 卡。

Reset: 每日 00:00 UTC+用户时区重置。

1.2 Pricing 页面 (New)

路径: /pricing

入口: Dashboard 顶部、学习页面 Pro 功能锁、Landing Page。

卡片设计:

Free (The Starter):

5 Words/Day.

基础听写模式。

标准例句。

Pro (The Master - $9.9/mo):

Infinite AI Cards.

Shadow Mode: 解锁长难句跟读与 AI 评分。

Smart Shuffle: 无限刷新例句。

Review Analytics: 详细的遗忘曲线图表。

2. 核心功能：智能制卡 (AI Creator)

2.1 提示词工程 (Prompt Engineering)

AI 生成必须基于用户的 "Context" (语境)。

输入: * 用户身份 (e.g., 职场人)

目标 (e.g., 雅思写作 Task 2)

目标分数 (e.g., Band 7.0)

逻辑: 不只是生成单词，而是生成为了达到该目标必须掌握的词。

System Prompt 核心: "You are an strict exam coach. User wants [Band 7.0] in [IELTS Writing]. Generate vocabulary that is HIGH-FREQUENCY for this specific goal. For each word, generate a rhythmic shadow sentence."

3. 核心功能：一体化学习卡片 (The One Card)

这是产品的灵魂。不再区分模式，单卡闭环。

3.1 状态 A: 听写 (Front Side)

视觉: 极简白底/黑底。

元素: * Invisible Audio: 卡片出现即自动播放单词发音。

Replay Icon: 右上角小喇叭，点击重播。

Input Field: 屏幕中央唯一的焦点。大号字体输入框。

交互: * 用户输入 -> 按 Enter。

Validation: * 如果空，抖动提示。

如果有内容，触发 Flip 动画。

3.2 状态 B: 反馈与跟读 (Back Side)

视觉: 上下滑动或翻转动画。

模块 1: 拼写反馈 (Diff Check)

Correct: 单词显示为黑色/白色 (Zen)。输入框变绿一瞬后消失。

Incorrect: 显示用户拼写的单词，错误字母高亮为 橙色 (#F97316)。正下方显示正确单词。

模块 2: 核心信息

音标 + 词性 (e.g., /æpl/ n.)。

中文释义 (根据 I18n 设置)。

模块 3: 语境 (The Context)

Standard Sentence: 短语例句 (Free/Pro 皆有)。

Shadow Sentence (Pro Only): * 长难句，加重阴影样式。

Free 用户: 显示为模糊文本 + 锁图标。点击跳转 Pricing。

Pro 用户: 显示完整句子。

Controls: [播放原声] [按住录音] [Shuffle/AI换句]。

模块 4: SRS 评分 (Anki Logic)

底部固定栏:

1 - Hard (1m) - 拼写错误自动高亮此项。

2 - Good (1d)。

3 - Easy (4d)。

4. 视觉交互：液态番茄钟 (Liquid Timer)

4.1 视觉描述

参考视频效果。不是普通的倒计时数字。

位置: 学习页面右上角。

形态: 黑色 (Dark Mode 下为白色) 的粘稠液体悬挂在顶部。

动态: 随着时间流逝（或每完成一组单词），液滴汇聚、变重、拉长，最后 "滴落" (Drop) 下来消失，代表时间/任务的消耗。

技术: 使用 SVG Filters (feGaussianBlur + feColorMatrix) 绑定在 DOM 元素上实现。