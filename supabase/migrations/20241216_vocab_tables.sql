-- Vocabulary Library Tables
-- Run this migration in Supabase SQL Editor

-- 1. Vocab Books Table (词书表)
CREATE TABLE IF NOT EXISTS vocab_books (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  word_count INTEGER DEFAULT 0,
  cover_image TEXT,
  cefr_level TEXT CHECK (cefr_level IN ('A1', 'A2', 'B1', 'B2', 'C1', 'C2')),
  category TEXT,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Add RLS policy
ALTER TABLE vocab_books ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Vocab books are viewable by everyone"
  ON vocab_books FOR SELECT
  USING (true);

-- 2. Vocab Words Table (词库单词表)
CREATE TABLE IF NOT EXISTS vocab_words (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id UUID REFERENCES vocab_books(id) ON DELETE CASCADE,
  word_rank INTEGER NOT NULL,
  head_word TEXT NOT NULL,
  us_phonetic TEXT,
  uk_phonetic TEXT,
  translations JSONB,
  sentences JSONB,
  real_exam_sentences JSONB,
  synonyms JSONB,
  phrases JSONB,
  memory_method TEXT,
  related_words JSONB,
  picture_url TEXT,
  exams JSONB,
  raw_content JSONB,
  UNIQUE(book_id, head_word)
);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_vocab_words_book_id ON vocab_words(book_id);
CREATE INDEX IF NOT EXISTS idx_vocab_words_head_word ON vocab_words(head_word);
CREATE INDEX IF NOT EXISTS idx_vocab_words_word_rank ON vocab_words(book_id, word_rank);

-- Add RLS policy
ALTER TABLE vocab_words ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Vocab words are viewable by everyone"
  ON vocab_words FOR SELECT
  USING (true);

-- 3. User Vocab Progress Table (用户学习进度表)
CREATE TABLE IF NOT EXISTS user_vocab_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  book_id UUID REFERENCES vocab_books(id) ON DELETE CASCADE,
  current_word_rank INTEGER DEFAULT 0,
  completed_count INTEGER DEFAULT 0,
  started_at TIMESTAMPTZ DEFAULT now(),
  last_studied_at TIMESTAMPTZ,
  UNIQUE(user_id, book_id)
);

-- Add RLS policy
ALTER TABLE user_vocab_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own progress"
  ON user_vocab_progress FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own progress"
  ON user_vocab_progress FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own progress"
  ON user_vocab_progress FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own progress"
  ON user_vocab_progress FOR DELETE
  USING (auth.uid() = user_id);

-- 4. Add daily_new_words_goal to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS daily_new_words_goal INTEGER DEFAULT 10;
