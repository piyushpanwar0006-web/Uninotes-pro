/**
 * Common HTTP headers to disable all forms of caching.
 * Used to prevent "stale data" bugs in Next.js/Browser.
 */
export const NO_CACHE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
  'Pragma': 'no-cache',
  'Expires': '0',
  'Surrogate-Control': 'no-store',
};

/**
 * Returns Cache-Control headers for CDN-cacheable public API responses.
 *
 * @param ttlSeconds - How long the CDN/edge caches the response (s-maxage).
 * @param swr        - stale-while-revalidate window in seconds (default 60s).
 *                     The CDN serves the stale response instantly while
 *                     fetching a fresh one in the background.
 *
 * Usage:
 *   response.headers.set('Cache-Control', publicCacheHeaders(300).['Cache-Control'])
 *   — or —
 *   return NextResponse.json(data, { headers: publicCacheHeaders(300) });
 */
export function publicCacheHeaders(ttlSeconds: number, swr = 60): HeadersInit {
  return {
    'Cache-Control': `public, s-maxage=${ttlSeconds}, stale-while-revalidate=${swr}`,
    'Vary': 'Accept-Encoding',
  };
}

/**
 * For authenticated, user-specific responses.
 * Prevents CDN caching; allows a single browser revalidation cycle.
 */
export const PRIVATE_CACHE_HEADERS: HeadersInit = {
  'Cache-Control': 'private, max-age=0, must-revalidate',
};

import { redis } from './rateLimit';

/**
 * O(1) Cache Invalidation using Versioning (Namespace pattern).
 * Increments the global version key. Old keys will simply expire 
 * naturally via their TTL, avoiding expensive SCAN/DEL operations.
 */
export async function invalidatePapersCache() {
  if (!redis) return;
  try {
    // 200ms timeout for invalidation to avoid blocking mutations
    await Promise.race([
      redis.incr('papers:list:version'),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Redis timeout')), 200))
    ]);
  } catch (err) {
    console.error('[Cache Invalidation Failed]', err);
  }
}

