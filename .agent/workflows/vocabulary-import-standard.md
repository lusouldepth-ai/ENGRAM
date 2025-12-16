# Vocabulary Import Standard

## Overview

This document defines the standard format and process for importing vocabulary books into ENGRAM.

---

## Standard Field Mapping

| Source Field | Database Column | Type | Required |
|--------------|-----------------|------|----------|
| `headWord` | `head_word` | text | ✅ |
| `wordRank` | `word_rank` | integer | ✅ |
| `bookId` | → lookup vocab_books | uuid | ✅ |
| `content.word.content.usphone` | `us_phonetic` | text | ❌ |
| `content.word.content.ukphone` | `uk_phonetic` | text | ❌ |
| `content.word.content.trans` | `translations` | jsonb | ❌ |
| `content.word.content.sentence.sentences` | `sentences` | jsonb | ❌ |
| `content.word.content.realExamSentence.sentences` | `real_exam_sentences` | jsonb | ❌ |
| `content.word.content.syno.synos` | `synonyms` | jsonb | ❌ |
| `content.word.content.phrase.phrases` | `phrases` | jsonb | ❌ |
| `content.word.content.remMethod.val` | `memory_method` | text | ❌ |
| `content.word.content.relWord.rels` | `related_words` | jsonb | ❌ |
| `content.word.content.picture` | `picture_url` | text | ❌ |
| `content.word.content.exam` | `exams` | jsonb | ❌ |
| *(entire object)* | `raw_content` | jsonb | ✅ |

---

## Supported Vocabulary Formats

### Format A: Full CET/GRE Format (like 四级真题核心词)

```json
{
  "wordRank": 1,
  "headWord": "access",
  "bookId": "CET4luan_1",
  "content": {
    "word": {
      "content": {
        "trans": [...],
        "sentence": {...},
        "realExamSentence": {...},
        "syno": {...},
        "phrase": {...},
        "remMethod": {...},
        "relWord": {...}
      }
    }
  }
}
```

### Format B: Simple Vocabulary List

```json
{
  "word": "access",
  "translation": "获取；接近",
  "phonetic": "/ˈækses/"
}
```

---

## Import Process

1. Place JSON file in `/data/` folder
2. Run import script: `npm run import-vocab <filename>`
3. Verify in Supabase Dashboard

---

## CEFR Level Mapping

| Book Category | CEFR Level |
|---------------|------------|
| 小学词汇 | A1 |
| 初中词汇 | A2 |
| 高中/四级 | B1 |
| 六级/考研 | B2 |
| 雅思/托福 | C1 |
| GRE/SAT | C2 |

---

## AI Enhancement Strategy

### Persona-Based Content Generation

When user reviews a vocab word, AI generates personalized content based on user profile:

| User Profile | AI Enhancement |
|--------------|----------------|
| **学生 (Student)** | 真题解析、考试技巧、记忆口诀 |
| **职场人士 (Professional)** | 商务邮件例句、会议表达、行业术语 |
| **兴趣爱好 (Hobbyist)** | 旅游场景、日常对话、影视歌曲 |

### Implementation

```typescript
// When generating shadow sentence:
const userPersona = await getUserPersona(userId);

const prompt = `
Generate a contextual example for the word "${word}".
User profile: ${userPersona.type}
${userPersona.type === 'student' ? 'Focus on exam scenarios' : ''}
${userPersona.type === 'professional' ? 'Focus on business/work scenarios' : ''}
${userPersona.type === 'hobbyist' ? 'Focus on travel/entertainment scenarios' : ''}
`;
```

---

## Quick Reference

- **Database Tables**: `vocab_books`, `vocab_words`, `user_vocab_progress`
- **Import Script**: `app/actions/vocab-actions.ts` → `importVocabBook()`
- **Schema File**: `supabase/migrations/vocab-tables.sql`
