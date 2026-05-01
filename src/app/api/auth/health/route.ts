import { NextRequest } from 'next/server';
import { successResponse } from '@/types/api';
export const dynamic = 'force-dynamic';

/**
 * GET /api/auth/health
 * 
 * Safe config diagnostic — returns what env vars are present and 
 * what the redirect URL will be. Never exposes secret values.
 * Remove or protect this route before going to production.
 */
export async function GET(req: NextRequest) {
  const origin = req.headers.get('origin') ?? req.headers.get('host') ?? 'unknown';

  return successResponse({
    env: {
      SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL
        ? `✅ Set (${process.env.NEXT_PUBLIC_SUPABASE_URL?.slice(0, 30)}...)`
        : '❌ MISSING',
      SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        ? `✅ Set (length: ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.length})`
        : '❌ MISSING',
      APP_URL: process.env.NEXT_PUBLIC_APP_URL ?? '❌ MISSING',
      SITE_URL: process.env.NEXT_PUBLIC_SITE_URL ?? '❌ MISSING',
      NODE_ENV: process.env.NODE_ENV,
    },
    expectedCallback: `${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}/auth/callback`,
    requestOrigin: origin,
    note: 'Add this callback URL to: Supabase → Auth → URL Configuration → Redirect URLs',
  });
}
