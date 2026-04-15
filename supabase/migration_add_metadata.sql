-- ============================================================
-- Migration: Add subject and grade metadata to pdf_uploads
-- Run this in the Supabase SQL Editor
-- ============================================================

-- Add subject and grade columns to pdf_uploads
ALTER TABLE pdf_uploads
  ADD COLUMN IF NOT EXISTS subject VARCHAR,
  ADD COLUMN IF NOT EXISTS grade   VARCHAR;

-- Add index for filtering in library
CREATE INDEX IF NOT EXISTS idx_pdf_uploads_subject ON pdf_uploads(subject);
CREATE INDEX IF NOT EXISTS idx_pdf_uploads_grade   ON pdf_uploads(grade);

-- Add parent_exercise_number column to exercises for sub-exercises
-- When an exercise has sub-exercises like 1a, 1b, 1c, the exercise_number
-- will be '1a', '1b', etc., and parent_exercise_number will be '1'
ALTER TABLE exercises
  ADD COLUMN IF NOT EXISTS parent_exercise_number VARCHAR,
  ADD COLUMN IF NOT EXISTS sub_exercise_letter    VARCHAR;

CREATE INDEX IF NOT EXISTS idx_exercises_parent ON exercises(parent_exercise_number);
