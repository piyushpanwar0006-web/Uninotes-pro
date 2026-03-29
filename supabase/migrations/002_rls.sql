-- ============================================================
-- Migration 002: Row-Level Security Policies
-- Enables RLS on all tables and defines access rules.
-- ============================================================

-- ============================================================
-- users
-- ============================================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can read public profile data
CREATE POLICY "users_select_own" ON public.users
  FOR SELECT USING (auth.uid() = id);

-- Everyone can read basic profile info (for uploader display)
CREATE POLICY "users_select_public" ON public.users
  FOR SELECT USING (true);

-- Users can only update their own profile
CREATE POLICY "users_update_own" ON public.users
  FOR UPDATE USING (auth.uid() = id);


-- ============================================================
-- subjects
-- ============================================================
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read subjects
CREATE POLICY "subjects_select_all" ON public.subjects
  FOR SELECT USING (true);

-- Only admins can insert/update/delete subjects
CREATE POLICY "subjects_admin_write" ON public.subjects
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );


-- ============================================================
-- papers
-- ============================================================
ALTER TABLE public.papers ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read ready papers
CREATE POLICY "papers_select_ready" ON public.papers
  FOR SELECT USING (
    status = 'ready' AND auth.uid() IS NOT NULL
  );

-- Uploaders can see their own papers regardless of status
CREATE POLICY "papers_select_own" ON public.papers
  FOR SELECT USING (auth.uid() = uploaded_by);

-- Authenticated users can upload
CREATE POLICY "papers_insert_authenticated" ON public.papers
  FOR INSERT WITH CHECK (auth.uid() = uploaded_by);

-- Only the uploader or an admin can delete
CREATE POLICY "papers_delete_own_or_admin" ON public.papers
  FOR DELETE USING (
    auth.uid() = uploaded_by OR
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );


-- ============================================================
-- notes
-- ============================================================
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notes_select_ready" ON public.notes
  FOR SELECT USING (
    status = 'ready' AND auth.uid() IS NOT NULL
  );

CREATE POLICY "notes_select_own" ON public.notes
  FOR SELECT USING (auth.uid() = uploaded_by);

CREATE POLICY "notes_insert_authenticated" ON public.notes
  FOR INSERT WITH CHECK (auth.uid() = uploaded_by);

CREATE POLICY "notes_delete_own_or_admin" ON public.notes
  FOR DELETE USING (
    auth.uid() = uploaded_by OR
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );


-- ============================================================
-- analysis
-- ============================================================
ALTER TABLE public.analysis ENABLE ROW LEVEL SECURITY;

-- Authenticated users can read analysis
CREATE POLICY "analysis_select_authenticated" ON public.analysis
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Only service role (backend) can insert/update analysis
-- (No policy needed — service role bypasses RLS)


-- ============================================================
-- bookmarks
-- ============================================================
ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;

-- Users can only read, create, and delete their own bookmarks
CREATE POLICY "bookmarks_own" ON public.bookmarks
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);


-- ============================================================
-- ratings
-- ============================================================
ALTER TABLE public.ratings ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read ratings (for averages)
CREATE POLICY "ratings_select_all" ON public.ratings
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Users can only manage their own ratings
CREATE POLICY "ratings_own_write" ON public.ratings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "ratings_own_update" ON public.ratings
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "ratings_own_delete" ON public.ratings
  FOR DELETE USING (auth.uid() = user_id);
