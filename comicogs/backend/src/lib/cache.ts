import crypto from "node:crypto";
import { redis, connectRedis } from "./redis";

/**
 * Generate a cache key from a path and query parameters
 */
export function keyFor(path: string, query: any): string {
  // Sort keys to ensure consistent cache keys for equivalent queries
  const normalized = JSON.stringify(query, Object.keys(query).sort());
  const hash = crypto.createHash("sha256").update(normalized).digest("hex");
  return `cache:${path}:${hash}`;
}

/**
 * Get a value from cache
 */
export async function cacheGet<T>(key: string): Promise<T | null> {
  try {
    await connectRedis();
    const value = await redis.get(key);
    return value ? JSON.parse(value) : null;
  } catch (error) {
    console.error("Cache get error:", error);
    return null;
  }
}

/**
 * Set a value in cache with optional TTL
 */
export async function cacheSet<T>(key: string, value: T, ttlSeconds: number = 90): Promise<void> {
  try {
    await connectRedis();
    const serialized = JSON.stringify(value);
    await redis.setEx(key, ttlSeconds, serialized);
  } catch (error) {
    console.error("Cache set error:", error);
  }
}

/**
 * Delete a specific cache key
 */
export async function cacheDel(key: string): Promise<void> {
  try {
    await connectRedis();
    await redis.del(key);
  } catch (error) {
    console.error("Cache delete error:", error);
  }
}

/**
 * Delete cache keys by pattern
 */
export async function cacheDelByPattern(pattern: string): Promise<number> {
  try {
    await connectRedis();
    let deletedCount = 0;
    
    for await (const key of redis.scanIterator({ MATCH: pattern })) {
      await redis.del(key);
      deletedCount++;
    }
    
    return deletedCount;
  } catch (error) {
    console.error("Cache delete by pattern error:", error);
    return 0;
  }
}

/**
 * Check if a key exists in cache
 */
export async function cacheExists(key: string): Promise<boolean> {
  try {
    await connectRedis();
    const exists = await redis.exists(key);
    return exists === 1;
  } catch (error) {
    console.error("Cache exists error:", error);
    return false;
  }
}

/**
 * Get TTL (time to live) for a cache key
 */
export async function cacheTTL(key: string): Promise<number> {
  try {
    await connectRedis();
    return await redis.ttl(key);
  } catch (error) {
    console.error("Cache TTL error:", error);
    return -1;
  }
}

/**
 * Invalidate cache patterns commonly used for listings
 */
export async function invalidateListingsCache(): Promise<void> {
  await cacheDelByPattern("cache:/api/listings:*");
  await cacheDelByPattern("cache:/api/search:*");
}

/**
 * Invalidate cache patterns commonly used for comics
 */
export async function invalidateComicsCache(): Promise<void> {
  await cacheDelByPattern("cache:/api/comics:*");
  await cacheDelByPattern("cache:/api/search:*");
}

/**
 * Cache wrapper function for easy caching of function results
 */
export async function withCache<T>(
  key: string,
  fetchFn: () => Promise<T>,
  ttlSeconds: number = 90
): Promise<T> {
  // Try to get from cache first
  const cached = await cacheGet<T>(key);
  if (cached !== null) {
    return cached;
  }
  
  // If not in cache, fetch and store
  const result = await fetchFn();
  await cacheSet(key, result, ttlSeconds);
  return result;
}

/**
 * Health check for cache system
 */
export async function cacheHealthCheck(): Promise<{ 
  status: 'ok' | 'error', 
  connected: boolean, 
  latency?: number 
}> {
  try {
    const start = Date.now();
    await connectRedis();
    
    // Test basic operations
    const testKey = `health-check-${Date.now()}`;
    const testValue = { timestamp: Date.now(), test: true };
    
    await cacheSet(testKey, testValue, 5); // 5 second TTL
    const retrieved = await cacheGet(testKey);
    await cacheDel(testKey);
    
    const latency = Date.now() - start;
    
    const isHealthy = retrieved && 
      retrieved.timestamp === testValue.timestamp && 
      retrieved.test === testValue.test;
    
    return {
      status: isHealthy ? 'ok' : 'error',
      connected: redis.isOpen,
      latency
    };
  } catch (error) {
    console.error("Cache health check failed:", error);
    return {
      status: 'error',
      connected: redis.isOpen
    };
  }
}