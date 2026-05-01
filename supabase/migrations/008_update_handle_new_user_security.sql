-- Migration 008: Revoke EXECUTE on handle_new_user from PUBLIC
-- Fixes Supabase security advisory: "Public Can Execute SECURITY DEFINER Function"
-- This ensures the trigger function cannot be called directly via the REST API.

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC;
