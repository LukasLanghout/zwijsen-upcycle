-- ============================================================
-- Zwijsen Upcycle - Supabase Schema
-- Run this in the Supabase SQL Editor to set up your database
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- STORAGE BUCKET
-- ============================================================
-- Create the storage bucket for PDF uploads
INSERT INTO storage.buckets (id, name, public)
VALUES ('pdf-uploads', 'pdf-uploads', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access to PDF storage
CREATE POLICY "Public read access" ON storage.objects
  FOR SELECT USING (bucket_id = 'pdf-uploads');

-- Allow authenticated and anon uploads
CREATE POLICY "Allow uploads" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'pdf-uploads');

-- Allow deletes
CREATE POLICY "Allow deletes" ON storage.objects
  FOR DELETE USING (bucket_id = 'pdf-uploads');

-- ============================================================
-- PDF UPLOADS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS pdf_uploads (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  filename    VARCHAR NOT NULL,
  storage_path VARCHAR NOT NULL,
  status      VARCHAR NOT NULL DEFAULT 'processing'
                CHECK (status IN ('processing', 'completed', 'failed')),
  page_count  INTEGER,
  created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- EXERCISES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS exercises (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pdf_upload_id     UUID REFERENCES pdf_uploads(id) ON DELETE CASCADE,
  page_number       INTEGER NOT NULL DEFAULT 1,
  exercise_number   VARCHAR NOT NULL,
  block             VARCHAR,
  lesson            VARCHAR,
  question_type     VARCHAR NOT NULL
                      CHECK (question_type IN ('fill_in', 'structured_hte', 'creative', 'pattern_puzzle')),
  difficulty_level  INTEGER NOT NULL DEFAULT 1
                      CHECK (difficulty_level IN (1, 2, 3)),
  topic             VARCHAR,
  learning_goal     TEXT,
  original_content  JSONB NOT NULL,
  transformed_content JSONB,
  status            VARCHAR NOT NULL DEFAULT 'pending'
                      CHECK (status IN ('pending', 'approved', 'rejected')),
  editor_notes      TEXT,
  created_at        TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at        TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Auto-update updated_at on row changes
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER exercises_updated_at
  BEFORE UPDATE ON exercises
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Indexes for common queries
CREATE INDEX idx_exercises_pdf_upload ON exercises(pdf_upload_id);
CREATE INDEX idx_exercises_status ON exercises(status);
CREATE INDEX idx_exercises_question_type ON exercises(question_type);
CREATE INDEX idx_exercises_difficulty ON exercises(difficulty_level);

-- ============================================================
-- EXERCISE VARIANTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS exercise_variants (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  exercise_id      UUID REFERENCES exercises(id) ON DELETE CASCADE,
  difficulty_level INTEGER NOT NULL CHECK (difficulty_level IN (1, 2, 3)),
  variant_content  JSONB NOT NULL,
  created_at       TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_variants_exercise ON exercise_variants(exercise_id);

-- ============================================================
-- DISABLE RLS (for PoC - enable and add policies for production)
-- ============================================================
ALTER TABLE pdf_uploads DISABLE ROW LEVEL SECURITY;
ALTER TABLE exercises DISABLE ROW LEVEL SECURITY;
ALTER TABLE exercise_variants DISABLE ROW LEVEL SECURITY;
