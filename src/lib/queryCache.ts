import { redis } from './rateLimit';

/**
 * cachedQuery — wraps an async DB fetch with Redis caching.
 *
 * Behaviour:
 *  1. If Redis is unavailable (env vars not set), falls through to `fetcher` — fail-open.
 *  2. On a cache HIT, returns the cached value immediately (no DB round-trip).
 *  3. On a cache MISS, calls `fetcher`, stores the result fire-and-forget (non-blocking),
 *     then returns the fresh data.
 *  4. If Redis throws at any point, falls through to `fetcher` — never blocks the response.
 *
 * @param key        - Unique Redis cache key for this query.
 * @param ttlSeconds - How long to store the result in Redis.
 * @param fetcher    - Async function that performs the actual DB query.
 *
 * @example
 *   // In /api/subjects GET handler:
 *   const data = await cachedQuery(
 *     `subjects:branch=${branch}:sem=${semester}`,
 *     300,
 *     () => adminClient.from('subjects').select('*').eq('branch', branch).then(r => r.data)
 *   );
 */
export async function cachedQuery<T>(
  key: string,
  ttlSeconds: number,
  fetcher: () => Promise<T>
): Promise<T> {
  if (!redis) {
    // No Redis configured — skip cache entirely (local dev / missing env vars)
    return fetcher();
  }

  try {
    const cached = await Promise.race([
      redis.get<T>(key),
      new Promise<null>((_, reject) =>
        setTimeout(() => reject(new Error('Redis get timeout')), 150)
      ),
    ]);

    if (cached !== null && cached !== undefined) {
      return cached;
    }
  } catch {
    // Redis unavailable or timed out — fall through to DB
  }

  const fresh = await fetcher();

  // Fire-and-forget: write to cache without blocking the response
  Promise.race([
    redis.set(key, fresh, { ex: ttlSeconds }),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Redis set timeout')), 150)
    ),
  ]).catch(() => {
    // Swallow silently — cache write failure is non-critical
  });

  return fresh;
}
