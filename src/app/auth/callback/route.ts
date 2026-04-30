import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /auth/callback
 *
 * Supabase redirects here after OAuth (Google) or Magic Link / email
 * confirmation. The `code` is exchanged for a session cookie.
 *
 * Security hardening:
 * - `next` param is validated to only allow same-origin redirects (open-redirect prevention)
 * - Error details are never exposed to the browser
 */
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  const rawNext = url.searchParams.get('next') ?? '/';

  // ── Open-redirect prevention: only allow relative paths ──────────────
  // Reject anything that starts with '//' or has a scheme (http/https/etc.)
  const isSafeRedirect = /^\/(?!\/)/.test(rawNext);
  const safeNext = isSafeRedirect ? rawNext : '/';

  if (code) {
    try {
      const supabase = await createClient();
      const { error } = await supabase.auth.exchangeCodeForSession(code);

      if (!error) {
        return NextResponse.redirect(new URL(safeNext, req.url));
      }

      console.error('[GET /auth/callback] exchangeCodeForSession error:', error.message);
    } catch (err) {
      console.error('[GET /auth/callback] Unexpected error:', err);
    }
  }

  // Redirect to sign-in page with a generic error flag (no internal details)
  return NextResponse.redirect(new URL('/?authError=true', req.url));
}
