import { type NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

/**
 * Next.js Edge Middleware.
 *
 * Required by @supabase/ssr to refresh the user's auth session on every
 * request. Without this, sessions expire and server-side calls fail.
 *
 * Access Control Strategy:
 *  - Guests can browse branches, subjects, view notes and PDFs freely.
 *  - Only upload, bookmark, and dashboard routes require authentication.
 *  - Unauthenticated users hitting protected pages are redirected to /?login=1
 *    which triggers the AuthModal on the home page (soft, contextual prompt).
 *
 * Matcher config below excludes static assets.
 */

/** Page-level routes that require authentication. */
const PROTECTED_PAGE_PATHS = ['/upload', '/dashboard', '/bookmark', '/profile'];

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh session — IMPORTANT: do not remove, required for auth to work.
  // getUser() is the only safe way to validate the session in middleware.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // Redirect unauthenticated users away from protected page routes.
  // We send them to /?login=1 so the AuthModal opens contextually on the
  // home page without a jarring full-page /login redirect.
  if (!user && PROTECTED_PAGE_PATHS.some((p) => pathname.startsWith(p))) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = '/';
    redirectUrl.searchParams.set('login', '1');
    // Preserve where they were trying to go so we can redirect after login
    redirectUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(redirectUrl);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match everything except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     * - public folder files
     *
     * PUBLIC (no auth required):
     *   /subjects/[subjectId]  — note listing pages
     *   /api/papers            — paper metadata
     *   /api/papers/[id]/signed-url — PDF access (guests can view PDFs)
     *
     * PROTECTED (auth required, redirect → /?login=1):
     *   /upload
     *   /dashboard
     *   /bookmark
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
