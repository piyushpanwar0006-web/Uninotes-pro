import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { successResponse, errorResponse } from '@/types/api';
export const dynamic = 'force-dynamic';

/* ─── In-memory rate limiter (max 5 Google auth attempts per IP per minute) ─── */
interface RateEntry { count: number; firstAt: number; }
const rateMap = new Map<string, RateEntry>();
const WINDOW_MS = 60_000;
const MAX_REQS  = 5;

function isRateLimited(ip: string): boolean {
  const now   = Date.now();
  const entry = rateMap.get(ip);
  if (!entry || now - entry.firstAt > WINDOW_MS) {
    rateMap.set(ip, { count: 1, firstAt: now });
    return false;
  }
  if (entry.count >= MAX_REQS) return true;
  entry.count++;
  return false;
}

/* ─── POST /api/auth/google ─── */
export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';

    if (isRateLimited(ip)) {
      return errorResponse('Too many sign-in attempts. Please wait a minute and try again.', 429, 'RATE_LIMIT_EXCEEDED');
    }

    // Validate the redirect origin matches our app (CSRF protection)
    const origin = req.headers.get('origin') ?? '';
    const allowedOrigins = [
      process.env.NEXT_PUBLIC_SITE_URL ?? '',
      'http://localhost:3000',
      'http://localhost:3001',
    ].filter(Boolean);

    if (!allowedOrigins.some(o => origin.startsWith(o))) {
      console.warn('[POST /api/auth/google] Blocked request from unknown origin:', origin);
      return errorResponse('Forbidden', 403, 'FORBIDDEN');
    }

    const body = await req.json().catch(() => ({}));
    const rawNext = typeof body.next === 'string' ? body.next : '/';

    // Open-redirect prevention
    const safeNext = /^\/(?!\/)/.test(rawNext) ? rawNext : '/';
    const redirectTo = `${origin}/auth/callback?next=${encodeURIComponent(safeNext)}`;

    const supabase = await createClient();
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo,
        queryParams: { access_type: 'offline', prompt: 'consent' },
        skipBrowserRedirect: true, // return URL to frontend instead of redirecting server-side
      },
    });

    if (error || !data?.url) {
      console.error('[POST /api/auth/google] OAuth error:', error?.message);
      if (error?.message?.toLowerCase().includes('provider is not enabled') ||
          error?.message?.toLowerCase().includes('unsupported provider')) {
        return errorResponse(
          'Google sign-in is not enabled. Please contact support or use email sign-in.',
          503,
          'PROVIDER_NOT_ENABLED'
        );
      }
      return errorResponse('Could not initiate Google sign-in. Please try again.', 500, 'OAUTH_ERROR');
    }

    return successResponse({ url: data.url });
  } catch (err) {
    console.error('[POST /api/auth/google]', err);
    return errorResponse('Internal server error.', 500, 'INTERNAL_ERROR');
  }
}
