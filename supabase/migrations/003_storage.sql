-- ============================================================
-- Migration 003: Storage Bucket Setup
-- Creates the private 'papers' bucket and its access policies.
-- Run in Supabase SQL Editor (Storage policies are managed via SQL).
-- ============================================================

-- Insert bucket (idempotent)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'papers',
  'papers',
  false,              -- private bucket; access only via signed URLs
  10485760,           -- 10 MB limit enforced at storage level
  ARRAY['application/pdf']
)
ON CONFLICT (id) DO UPDATE SET
  file_size_limit    = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;


-- ============================================================
-- Storage RLS Policies
-- ============================================================

-- Authenticated users can upload to their own folder: {user_id}/*
CREATE POLICY "storage_papers_upload" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'papers' AND
    auth.uid() IS NOT NULL AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Users can read their own uploaded files
-- (other files require a signed URL generated server-side)
CREATE POLICY "storage_papers_read_own" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'papers' AND
    auth.uid() IS NOT NULL AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Users can delete only their own files
CREATE POLICY "storage_papers_delete_own" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'papers' AND
    auth.uid() IS NOT NULL AND
    (storage.foldername(name))[1] = auth.uid()::text
  );
