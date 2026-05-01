-- ============================================================
-- Migration 009: Engagement Counters
-- Adds columns to notes and papers to cache engagement stats 
-- and sets up database triggers for automatic synchronization.
-- ============================================================

-- 1. Add counter columns to notes
ALTER TABLE public.notes 
ADD COLUMN IF NOT EXISTS saved_count INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS rating_avg FLOAT NOT NULL DEFAULT 0.0,
ADD COLUMN IF NOT EXISTS rating_count INTEGER NOT NULL DEFAULT 0;

-- 2. Add counter columns to papers
ALTER TABLE public.papers 
ADD COLUMN IF NOT EXISTS saved_count INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS rating_avg FLOAT NOT NULL DEFAULT 0.0,
ADD COLUMN IF NOT EXISTS rating_count INTEGER NOT NULL DEFAULT 0;

-- 3. Function and trigger for ratings
CREATE OR REPLACE FUNCTION public.update_rating_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    IF OLD.resource_type = 'note' THEN
      UPDATE public.notes
      SET rating_avg = (SELECT COALESCE(AVG(score), 0.0) FROM public.ratings WHERE resource_id = OLD.resource_id AND resource_type = 'note'),
          rating_count = (SELECT COUNT(*) FROM public.ratings WHERE resource_id = OLD.resource_id AND resource_type = 'note')
      WHERE id = OLD.resource_id;
    ELSIF OLD.resource_type = 'paper' THEN
      UPDATE public.papers
      SET rating_avg = (SELECT COALESCE(AVG(score), 0.0) FROM public.ratings WHERE resource_id = OLD.resource_id AND resource_type = 'paper'),
          rating_count = (SELECT COUNT(*) FROM public.ratings WHERE resource_id = OLD.resource_id AND resource_type = 'paper')
      WHERE id = OLD.resource_id;
    END IF;
    RETURN OLD;
  ELSE
    IF NEW.resource_type = 'note' THEN
      UPDATE public.notes
      SET rating_avg = (SELECT COALESCE(AVG(score), 0.0) FROM public.ratings WHERE resource_id = NEW.resource_id AND resource_type = 'note'),
          rating_count = (SELECT COUNT(*) FROM public.ratings WHERE resource_id = NEW.resource_id AND resource_type = 'note')
      WHERE id = NEW.resource_id;
    ELSIF NEW.resource_type = 'paper' THEN
      UPDATE public.papers
      SET rating_avg = (SELECT COALESCE(AVG(score), 0.0) FROM public.ratings WHERE resource_id = NEW.resource_id AND resource_type = 'paper'),
          rating_count = (SELECT COUNT(*) FROM public.ratings WHERE resource_id = NEW.resource_id AND resource_type = 'paper')
      WHERE id = NEW.resource_id;
    END IF;
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- Revoke public execution to satisfy security scanners
REVOKE EXECUTE ON FUNCTION public.update_rating_stats() FROM PUBLIC;

DROP TRIGGER IF EXISTS on_rating_change ON public.ratings;
CREATE TRIGGER on_rating_change
AFTER INSERT OR UPDATE OR DELETE ON public.ratings
FOR EACH ROW EXECUTE FUNCTION public.update_rating_stats();

-- 4. Function and trigger for bookmarks
CREATE OR REPLACE FUNCTION public.update_bookmark_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.resource_type = 'note' THEN
      UPDATE public.notes SET saved_count = saved_count + 1 WHERE id = NEW.resource_id;
    ELSIF NEW.resource_type = 'paper' THEN
      UPDATE public.papers SET saved_count = saved_count + 1 WHERE id = NEW.resource_id;
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.resource_type = 'note' THEN
      UPDATE public.notes SET saved_count = GREATEST(saved_count - 1, 0) WHERE id = OLD.resource_id;
    ELSIF OLD.resource_type = 'paper' THEN
      UPDATE public.papers SET saved_count = GREATEST(saved_count - 1, 0) WHERE id = OLD.resource_id;
    END IF;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- Revoke public execution to satisfy security scanners
REVOKE EXECUTE ON FUNCTION public.update_bookmark_stats() FROM PUBLIC;

DROP TRIGGER IF EXISTS on_bookmark_change ON public.bookmarks;
CREATE TRIGGER on_bookmark_change
AFTER INSERT OR DELETE ON public.bookmarks
FOR EACH ROW EXECUTE FUNCTION public.update_bookmark_stats();
