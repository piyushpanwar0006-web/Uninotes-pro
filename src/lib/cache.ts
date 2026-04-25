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
