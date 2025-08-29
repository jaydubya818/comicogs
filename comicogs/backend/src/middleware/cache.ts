import type { Request, Response, NextFunction } from "express";
import crypto from "crypto";

// Extend Response interface to include sendCached method
declare global {
  namespace Express {
    interface Response {
      sendCached?: (payload: any, lastModified?: Date) => void;
    }
  }
}

/**
 * Middleware for conditional GET support with ETags and Last-Modified headers
 */
export function conditionalGet(req: Request, res: Response, next: NextFunction) {
  // Set cache headers
  res.setHeader("Cache-Control", "public, max-age=30, stale-while-revalidate=120");
  
  // Add sendCached helper method to response
  res.sendCached = (payload: any, lastModified?: Date) => {
    const body = JSON.stringify(payload);
    const etag = `"${crypto.createHash("sha1").update(body).digest("hex")}"`;
    
    res.setHeader("ETag", etag);
    
    if (lastModified) {
      res.setHeader("Last-Modified", lastModified.toUTCString());
    }
    
    // Check If-None-Match header
    const ifNoneMatch = req.header("If-None-Match");
    if (ifNoneMatch === etag) {
      return res.status(304).end();
    }
    
    // Check If-Modified-Since header
    const ifModifiedSince = req.header("If-Modified-Since");
    if (ifModifiedSince && lastModified) {
      const ifModifiedSinceDate = new Date(ifModifiedSince);
      if (ifModifiedSinceDate >= lastModified) {
        return res.status(304).end();
      }
    }
    
    res.type("application/json").send(body);
  };
  
  next();
}

/**
 * In-memory rate limiter with sliding window
 */
const rateLimitBuckets = new Map<string, { count: number; resetTime: number }>();

export function rateLimit(limit = 60, windowMs = 60_000) {
  return (req: Request, res: Response, next: NextFunction) => {
    const key = `${req.ip}:${req.user?.id ?? "anon"}`;
    const now = Date.now();
    
    let bucket = rateLimitBuckets.get(key);
    
    // Reset bucket if window has passed
    if (!bucket || now > bucket.resetTime) {
      bucket = { count: 0, resetTime: now + windowMs };
      rateLimitBuckets.set(key, bucket);
    }
    
    bucket.count++;
    
    // Clean up old buckets periodically
    if (Math.random() < 0.01) { // 1% chance to clean up
      const cutoff = now - windowMs;
      for (const [bucketKey, bucketData] of rateLimitBuckets.entries()) {
        if (bucketData.resetTime < cutoff) {
          rateLimitBuckets.delete(bucketKey);
        }
      }
    }
    
    // Set rate limit headers
    res.setHeader('X-RateLimit-Limit', limit);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, limit - bucket.count));
    res.setHeader('X-RateLimit-Reset', Math.ceil(bucket.resetTime / 1000));
    
    if (bucket.count > limit) {
      return res.status(429).json({ 
        error: "Too many requests",
        message: `Rate limit exceeded. Try again in ${Math.ceil((bucket.resetTime - now) / 1000)} seconds.`,
        retryAfter: Math.ceil((bucket.resetTime - now) / 1000)
      });
    }
    
    next();
  };
}

/**
 * Rate limit specifically for mutation operations (POST, PUT, DELETE)
 */
export function mutationRateLimit(limit = 20, windowMs = 60_000) {
  const limiter = rateLimit(limit, windowMs);
  
  return (req: Request, res: Response, next: NextFunction) => {
    // Only apply to mutation methods
    if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
      return limiter(req, res, next);
    }
    next();
  };
}
