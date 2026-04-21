import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /auth/callback
 *
 * Supabase redirects here after OAuth (Google, GitHub, etc.) or
 * Magic Link / email confirmation flows. The `code` query param is
 * exchanged for a session which is written into cookies before we
 * redirect the user to the intended destination.
 */
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  const next = url.searchParams.get('next') ?? '/';

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Redirect to the page the user originally requested (or home)
      return NextResponse.redirect(new URL(next, req.url));
    }

    console.error('[GET /auth/callback] exchangeCodeForSession error:', error.message);
  }

  // Fallback — something went wrong, send the user home with an error hint
  return NextResponse.redirect(
    new URL('/?authError=callback_failed', req.url)
  );
}
