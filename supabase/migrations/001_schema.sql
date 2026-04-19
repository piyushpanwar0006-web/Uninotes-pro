-- ============================================================
-- Migration 001: Core Schema
-- Run this in Supabase SQL Editor or via the Supabase CLI:
--   supabase db reset  (local)
--   supabase db push   (remote)
-- ============================================================

-- Enable UUID extension (already enabled on Supabase by default)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- Helper: auto-update updated_at timestamp
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = '';


-- ============================================================
-- Table: users
-- Extends auth.users with profile information.
-- Rows are created automatically via a trigger on auth.users.
-- ============================================================
CREATE TABLE IF NOT EXISTS public.users (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name   TEXT,
  avatar_url  TEXT,
  role        TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Auto-create a profile row when a new auth user signs up
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();


-- ============================================================
-- Table: subjects
-- Catalogue of academic subjects by branch and semester.
-- ============================================================
CREATE TABLE IF NOT EXISTS public.subjects (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  branch      TEXT NOT NULL,
  semester    SMALLINT NOT NULL CHECK (semester BETWEEN 1 AND 10),
  name        TEXT NOT NULL,
  code        TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE (branch, semester, name)
);

CREATE INDEX IF NOT EXISTS idx_subjects_branch_semester
  ON public.subjects (branch, semester);


-- ============================================================
-- Table: papers (past-year question papers / uploaded PDFs)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.papers (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subject_id    UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  uploaded_by   UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title         TEXT NOT NULL,
  description   TEXT,
  storage_path  TEXT NOT NULL UNIQUE,
  size_bytes    BIGINT NOT NULL CHECK (size_bytes > 0),
  status        TEXT NOT NULL DEFAULT 'processing'
                  CHECK (status IN ('processing', 'ready', 'failed')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_papers_subject_id   ON public.papers (subject_id);
CREATE INDEX IF NOT EXISTS idx_papers_uploaded_by  ON public.papers (uploaded_by);
CREATE INDEX IF NOT EXISTS idx_papers_status       ON public.papers (status);

CREATE TRIGGER papers_updated_at
  BEFORE UPDATE ON public.papers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();


-- ============================================================
-- Table: notes (lecture notes uploaded by students/teachers)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.notes (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subject_id    UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  uploaded_by   UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title         TEXT NOT NULL,
  description   TEXT,
  storage_path  TEXT NOT NULL UNIQUE,
  size_bytes    BIGINT NOT NULL CHECK (size_bytes > 0),
  status        TEXT NOT NULL DEFAULT 'processing'
                  CHECK (status IN ('processing', 'ready', 'failed')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notes_subject_id   ON public.notes (subject_id);
CREATE INDEX IF NOT EXISTS idx_notes_uploaded_by  ON public.notes (uploaded_by);

CREATE TRIGGER notes_updated_at
  BEFORE UPDATE ON public.notes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();


-- ============================================================
-- Table: analysis
-- AI-generated insights for a paper, stored as JSONB.
-- ============================================================
CREATE TABLE IF NOT EXISTS public.analysis (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  paper_id    UUID NOT NULL REFERENCES public.papers(id) ON DELETE CASCADE,
  content     JSONB NOT NULL DEFAULT '{}',
  model_used  TEXT NOT NULL DEFAULT 'gemini-pro',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE (paper_id)  -- one analysis result per paper
);

CREATE INDEX IF NOT EXISTS idx_analysis_paper_id ON public.analysis (paper_id);

CREATE TRIGGER analysis_updated_at
  BEFORE UPDATE ON public.analysis
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();


-- ============================================================
-- Table: bookmarks
-- Users can bookmark papers or notes for quick access.
-- ============================================================
CREATE TABLE IF NOT EXISTS public.bookmarks (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  resource_type   TEXT NOT NULL CHECK (resource_type IN ('paper', 'note')),
  resource_id     UUID NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE (user_id, resource_type, resource_id)
);

CREATE INDEX IF NOT EXISTS idx_bookmarks_user_id     ON public.bookmarks (user_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_resource    ON public.bookmarks (resource_type, resource_id);


-- ============================================================
-- Table: ratings
-- Users rate papers or notes on a 1–5 scale.
-- ============================================================
CREATE TABLE IF NOT EXISTS public.ratings (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  resource_type   TEXT NOT NULL CHECK (resource_type IN ('paper', 'note')),
  resource_id     UUID NOT NULL,
  score           SMALLINT NOT NULL CHECK (score BETWEEN 1 AND 5),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE (user_id, resource_type, resource_id)  -- one rating per user per resource
);

CREATE INDEX IF NOT EXISTS idx_ratings_resource ON public.ratings (resource_type, resource_id);
