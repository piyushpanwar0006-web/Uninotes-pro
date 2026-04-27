-- Migration 006: Add profile fields to users table
-- Adds college, branch, semester so users can personalise their profile page.

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS college  TEXT,
  ADD COLUMN IF NOT EXISTS branch   TEXT,
  ADD COLUMN IF NOT EXISTS semester SMALLINT CHECK (semester BETWEEN 1 AND 10);
