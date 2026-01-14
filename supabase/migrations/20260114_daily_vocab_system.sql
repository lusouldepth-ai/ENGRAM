-- Daily Vocabulary Injection System - Database Migration
-- Run this in Supabase SQL Editor

-- 1. Add daily_new_words_goal field (if not exists)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS daily_new_words_goal INTEGER DEFAULT 10;

-- 2. Add last_new_words_date to track when new words were last injected
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_new_words_date DATE;

-- 3. Add selected_vocab_book_id to link user to their chosen vocab book
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS selected_vocab_book_id UUID REFERENCES vocab_books(id);

-- 4. Create index for faster lookups on selected_vocab_book_id
CREATE INDEX IF NOT EXISTS idx_profiles_selected_vocab_book ON profiles(selected_vocab_book_id);

-- Verify the changes
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND column_name IN ('daily_new_words_goal', 'last_new_words_date', 'selected_vocab_book_id');
