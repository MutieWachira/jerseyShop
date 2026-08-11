/**
 * Simple in-memory token bucket rate limiter.
 *
 * NOTE:
 * This is suitable only for development or a single server instance.
 * In production with multiple instances, replace this implementation
 * with Redis (e.g. Upstash Redis + @upstash/ratelimit).
 */

type RateLimitRecord = {
  count: number;
  expiresAt: number;
};

const memoryCache = new Map<string, RateLimitRecord>();

export async function rateLimit(
  ip: string,
  limit = 5,
  windowMs = 60_000
): Promise<{
  success: boolean;
  headers: Record<string, string>;
}> {
  const now = Date.now();

  // Unique cache key for each IP
  const key = `ratelimit:${ip}`;

  const record = memoryCache.get(key);

  // First request or expired window
  if (!record || now > record.expiresAt) {
    memoryCache.set(key, {
      count: 1,
      expiresAt: now + windowMs,
    });

    return {
      success: true,
      headers: {
        "X-RateLimit-Limit": String(limit),
        "X-RateLimit-Remaining": String(limit - 1),
        "Retry-After": String(Math.ceil(windowMs / 1000)),
      },
    };
  }

  // Limit exceeded
  if (record.count >= limit) {
    return {
      success: false,
      headers: {
        "X-RateLimit-Limit": String(limit),
        "X-RateLimit-Remaining": "0",
        "Retry-After": String(
          Math.ceil((record.expiresAt - now) / 1000)
        ),
      },
    };
  }

  // Increment request count
  record.count++;

  memoryCache.set(key, record);

  return {
    success: true,
    headers: {
      "X-RateLimit-Limit": String(limit),
      "X-RateLimit-Remaining": String(limit - record.count),
      "Retry-After": String(
        Math.ceil((record.expiresAt - now) / 1000)
      ),
    },
  };
}