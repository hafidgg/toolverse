import "server-only";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const hasUpstash = Boolean(
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
);

// Distributed limiter (works correctly across serverless instances). Used
// whenever Upstash credentials are configured — required for real production
// protection, since Vercel's serverless functions don't share memory.
const redisLimiter = hasUpstash
  ? new Ratelimit({
      redis: Redis.fromEnv(),
      limiter: Ratelimit.slidingWindow(10, "60 s"),
      analytics: true,
      prefix: "toolverse:ratelimit",
    })
  : null;

// In-memory fallback: only correct for a single-instance local dev server.
// NOT a substitute for Upstash in production — kept only so the app still
// runs locally without requiring Upstash to be configured for development.
const memoryBuckets = new Map<string, { count: number; resetAt: number }>();

function memoryFallback(
  identifier: string,
  limit: number,
  windowMs: number
): { success: boolean; remaining: number } {
  const now = Date.now();
  const bucket = memoryBuckets.get(identifier);
  if (!bucket || now > bucket.resetAt) {
    memoryBuckets.set(identifier, { count: 1, resetAt: now + windowMs });
    return { success: true, remaining: limit - 1 };
  }
  bucket.count += 1;
  return { success: bucket.count <= limit, remaining: Math.max(0, limit - bucket.count) };
}

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  usingFallback: boolean;
}

/**
 * Rate-limit a request by identifier (typically an IP address, optionally
 * combined with a route name so different endpoints have independent
 * limits). Uses Upstash Redis when configured (correct in serverless/
 * multi-instance production); falls back to an in-memory limiter otherwise
 * so local development doesn't require an Upstash account.
 */
export async function rateLimit(
  identifier: string,
  { limit = 10, windowSeconds = 60 }: { limit?: number; windowSeconds?: number } = {}
): Promise<RateLimitResult> {
  if (redisLimiter) {
    const result = await redisLimiter.limit(identifier);
    return { success: result.success, remaining: result.remaining, usingFallback: false };
  }

  const { success, remaining } = memoryFallback(identifier, limit, windowSeconds * 1000);
  return { success, remaining, usingFallback: true };
}

export { hasUpstash };
