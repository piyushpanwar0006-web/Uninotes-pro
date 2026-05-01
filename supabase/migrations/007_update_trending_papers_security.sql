-- Migration 007: Fix security definer warning for get_trending_papers
-- Supabase advisory recommends changing SECURITY DEFINER to SECURITY INVOKER 
-- for functions that are accessible via the API.

ALTER FUNCTION public.get_trending_papers(integer, integer) SECURITY INVOKER;
