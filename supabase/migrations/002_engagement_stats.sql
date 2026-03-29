-- Migration 002: Engagement Stats (Bookmarks, Ratings, Downloads, Profile Stats)

-- 1. Table: resource_downloads
-- Logs individual download events to track trending and popular resources.
CREATE TABLE IF NOT EXISTS public.resource_downloads (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  resource_type   TEXT NOT NULL CHECK (resource_type IN ('paper', 'note')),
  resource_id     UUID NOT NULL,
  user_id         UUID REFERENCES public.users(id) ON DELETE SET NULL, -- Nullable for anon users if allowed
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_resource_downloads_id_time
  ON public.resource_downloads (resource_id, created_at);

-- 2. View: paper_stats
-- Computes the average rating and total ratings for each paper on the fly automatically.
CREATE OR REPLACE VIEW public.paper_stats AS
SELECT 
  p.id AS paper_id,
  COALESCE(AVG(r.score), 0) AS average_rating,
  COUNT(r.id) AS total_ratings,
  (SELECT COUNT(*) FROM public.resource_downloads d WHERE d.resource_id = p.id) AS total_downloads
FROM 
  public.papers p
LEFT JOIN 
  public.ratings r ON p.id = r.resource_id AND r.resource_type = 'paper'
GROUP BY 
  p.id;

-- 3. Function: get_trending_papers
-- Returns top 10 papers sorted by the number of downloads within the last N days.
CREATE OR REPLACE FUNCTION get_trending_papers(days INT DEFAULT 7, max_limit INT DEFAULT 10)
RETURNS TABLE (
  paper_id UUID,
  download_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    d.resource_id AS paper_id,
    COUNT(*) AS download_count
  FROM 
    public.resource_downloads d
  WHERE 
    d.resource_type = 'paper'
    AND d.created_at >= (NOW() - (days || ' days')::INTERVAL)
  GROUP BY 
    d.resource_id
  ORDER BY 
    download_count DESC
  LIMIT max_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
