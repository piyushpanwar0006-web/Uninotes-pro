import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { log } from './logger';

/**
 * Upstash Redis-backed Rate Limiter
 * 
 * This is the industry standard for Next.js serverless/edge environments.
 * It uses a sliding window algorithm and persists state globally.
 */

// Initialize Redis only if tokens are provided
const hasRedisConfig = !!process.env.UPSTASH_REDIS_REST_URL && !!process.env.UPSTASH_REDIS_REST_TOKEN;

export const redis = hasRedisConfig
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    })
  : null;

// ============================================================
// Rate Limit Configurations
// ============================================================

const ratelimits = {
  // Uploads: 5 per minute
  upload: hasRedisConfig
    ? new Ratelimit({
        redis: redis!,
        limiter: Ratelimit.slidingWindow(5, '1 m'),
        analytics: true,
      })
    : null,

  // Deletes: 10 per minute
  delete: hasRedisConfig
    ? new Ratelimit({
        redis: redis!,
        limiter: Ratelimit.slidingWindow(10, '1 m'),
        analytics: true,
      })
    : null,

  // Auth: 5 attempts per 10 seconds
  auth: hasRedisConfig
    ? new Ratelimit({
        redis: redis!,
        limiter: Ratelimit.slidingWindow(5, '10 s'),
        analytics: true,
      })
    : null,
};

// ============================================================
// In-Memory Fallback (For local dev without Redis)
// ============================================================
const memoryCache = new Map<string, { count: number; expiresAt: number }>();

function checkMemoryLimit(
  identifier: string,
  limit: number,
  windowMs: number
): { success: boolean; limit: number; remaining: number } {
  const now = Date.now();
  const record = memoryCache.get(identifier);

  if (!record || record.expiresAt < now) {
    memoryCache.set(identifier, { count: 1, expiresAt: now + windowMs });
    return { success: true, limit, remaining: limit - 1 };
  }

  if (record.count >= limit) {
    return { success: false, limit, remaining: 0 };
  }

  record.count++;
  return { success: true, limit, remaining: limit - record.count };
}

// ============================================================
// Public API
// ============================================================

export type RateLimitCategory = keyof typeof ratelimits;

export async function checkRateLimit(
  identifier: string,
  category: RateLimitCategory
): Promise<{ success: boolean; limit: number; remaining: number }> {
  const cacheKey = `${category}:${identifier}`;

  if (hasRedisConfig && ratelimits[category]) {
    try {
      const result = await ratelimits[category]!.limit(cacheKey);
      return {
        success: result.success,
        limit: result.limit,
        remaining: result.remaining,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      log.error(`Rate limit Redis check failed for ${cacheKey}`, { error: errorMessage });
      // Fall open to memory cache if Redis is down
    }
  }

  // Fallback limits
  const fallbackLimits = {
    upload: { limit: 5, windowMs: 60000 },
    delete: { limit: 10, windowMs: 60000 },
    auth: { limit: 5, windowMs: 10000 },
  };

  const config = fallbackLimits[category];
  return checkMemoryLimit(cacheKey, config.limit, config.windowMs);
}
