/**
 * Cache + Rate Limiting for AI Agent
 * Prevents duplicate API calls and controls costs
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttlMs: number;
}

const apiCache = new Map<string, CacheEntry<any>>();
const rateLimitBuckets: Record<string, { count: number; resetAt: number }> = {};

/**
 * Generate cache key from lead data
 */
export function generateLeadCacheKey(lead: any): string {
  return `lead:${lead.location}:${lead.property}:${lead.price}:${lead.source}`;
}

/**
 * Get cached result if available and not expired
 */
export function getCachedResult<T>(key: string): T | null {
  const entry = apiCache.get(key);
  if (!entry) return null;

  const isExpired = Date.now() - entry.timestamp > entry.ttlMs;
  if (isExpired) {
    apiCache.delete(key);
    return null;
  }

  return entry.data as T;
}

/**
 * Store result in cache with TTL
 */
export function setCachedResult<T>(key: string, data: T, ttlMs: number = 86400000): void {
  apiCache.set(key, {
    data,
    timestamp: Date.now(),
    ttlMs,
  });
}

/**
 * Clear expired cache entries
 */
export function cleanupCache(): number {
  let removed = 0;
  for (const [key, entry] of apiCache.entries()) {
    const isExpired = Date.now() - entry.timestamp > entry.ttlMs;
    if (isExpired) {
      apiCache.delete(key);
      removed++;
    }
  }
  return removed;
}

/**
 * Check rate limit for API calls
 * Returns remaining quota before hitting limit
 */
export function checkRateLimit(
  bucket: string,
  maxCallsPerHour: number = 1000
): { allowed: boolean; remaining: number; resetInSeconds: number } {
  const now = Date.now();
  let bucketData = rateLimitBuckets[bucket];

  // Initialize or reset if hour has passed
  if (!bucketData || now > bucketData.resetAt) {
    bucketData = {
      count: 0,
      resetAt: now + 3600000, // 1 hour
    };
    rateLimitBuckets[bucket] = bucketData;
  }

  bucketData.count++;
  const remaining = Math.max(0, maxCallsPerHour - bucketData.count);
  const resetInSeconds = Math.ceil((bucketData.resetAt - now) / 1000);

  return {
    allowed: bucketData.count <= maxCallsPerHour,
    remaining,
    resetInSeconds,
  };
}

/**
 * Get cache statistics
 */
export function getCacheStats() {
  return {
    cachedItems: apiCache.size,
    cacheMemoryBytes: JSON.stringify(Array.from(apiCache.entries())).length,
    rateLimitBuckets: Object.keys(rateLimitBuckets).length,
  };
}

/**
 * Clear all caches (useful for testing)
 */
export function clearAllCaches(): void {
  apiCache.clear();
  Object.keys(rateLimitBuckets).forEach((key) => delete rateLimitBuckets[key]);
}
