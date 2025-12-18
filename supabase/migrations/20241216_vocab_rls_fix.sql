-- Fix RLS policies for vocabulary import
-- Run this in Supabase SQL Editor

-- Allow authenticated users to insert vocab_books (for admin import)
CREATE POLICY "Allow insert vocab_books for authenticated"
  ON vocab_books FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Allow authenticated users to update vocab_books
CREATE POLICY "Allow update vocab_books for authenticated"
  ON vocab_books FOR UPDATE
  TO authenticated
  USING (true);

-- Allow authenticated users to delete vocab_books
CREATE POLICY "Allow delete vocab_books for authenticated"
  ON vocab_books FOR DELETE
  TO authenticated
  USING (true);

-- Allow authenticated users to insert vocab_words
CREATE POLICY "Allow insert vocab_words for authenticated"
  ON vocab_words FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Allow authenticated users to update vocab_words
CREATE POLICY "Allow update vocab_words for authenticated"
  ON vocab_words FOR UPDATE
  TO authenticated
  USING (true);

-- Allow authenticated users to delete vocab_words
CREATE POLICY "Allow delete vocab_words for authenticated"
  ON vocab_words FOR DELETE
  TO authenticated
  USING (true);
