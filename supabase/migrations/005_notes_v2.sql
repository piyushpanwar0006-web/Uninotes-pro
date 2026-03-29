-- ============================================================
-- Migration 005: Enhanced Notes Schema
-- Adds denormalized subject_code and downloads tracking.
-- ============================================================

-- 1. Add columns to notes table
ALTER TABLE public.notes 
ADD COLUMN IF NOT EXISTS subject_code TEXT,
ADD COLUMN IF NOT EXISTS downloads INTEGER NOT NULL DEFAULT 0;

-- 2. Create index for performance
CREATE INDEX IF NOT EXISTS idx_notes_subject_code ON public.notes (subject_code);

-- 3. Populate subject_code from subjects table
-- This handles legacy data that was referencing subject_id
UPDATE public.notes n
SET subject_code = s.code
FROM public.subjects s
WHERE n.subject_id = s.id
AND n.subject_code IS NULL;

-- 4. Enable RLS or update policies if necessary (assuming public read exists)
-- (No change needed if existing paper policies cover notes or if notes use standard RLS)
