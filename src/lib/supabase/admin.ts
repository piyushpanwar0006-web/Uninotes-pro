import { createClient } from '@supabase/supabase-js';

/**
 * Admin (service-role) Supabase client.
 * Bypasses Row Level Security — use ONLY in server-side code for privileged
 * operations (e.g. generating signed URLs, uploading to private buckets).
 *
 * NEVER expose this client or the service role key to the browser.
 */
export function createAdminClient() {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error(
      'SUPABASE_SERVICE_ROLE_KEY is not set. Add it to .env.local.'
    );
  }

  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
