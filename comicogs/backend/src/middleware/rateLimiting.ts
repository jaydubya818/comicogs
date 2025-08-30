import type { Request, Response, NextFunction } from 'express'
import { Redis } from 'ioredis'

interface RateLimitConfig {
  windowMs: number // Time window in milliseconds
  maxRequests: number // Maximum requests per window
  skipSuccessfulRequests?: boolean
  skipFailedRequests?: boolean
  keyGenerator?: (req: Request) => string
  onLimitReached?: (req: Request, res: Response) => void
}

interface RateLimitInfo {
  count: number
  resetTime: number
}

class RateLimiter {
  private redis: Redis | null = null
  private memoryStore = new Map<string, RateLimitInfo>()

  constructor() {
    try {
      this.redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379')
    } catch (error) {
      console.warn('Redis not available, using memory store for rate limiting')
    }
  }

  async increment(key: string, windowMs: number): Promise<RateLimitInfo> {
    const now = Date.now()
    const resetTime = now + windowMs

    if (this.redis) {
      return this.incrementRedis(key, windowMs, resetTime)
    } else {
      return this.incrementMemory(key, windowMs, resetTime)
    }
  }

  private async incrementRedis(key: string, windowMs: number, resetTime: number): Promise<RateLimitInfo> {
    const pipeline = this.redis!.pipeline()
    const redisKey = `rate_limit:${key}`
    
    // Use sliding window with Redis
    pipeline.zremrangebyscore(redisKey, 0, Date.now() - windowMs)
    pipeline.zadd(redisKey, Date.now(), `${Date.now()}-${Math.random()}`)
    pipeline.zcard(redisKey)
    pipeline.expire(redisKey, Math.ceil(windowMs / 1000))
    
    const results = await pipeline.exec()
    const count = results?.[2]?.[1] as number || 0
    
    return { count, resetTime }
  }

  private incrementMemory(key: string, windowMs: number, resetTime: number): RateLimitInfo {
    const now = Date.now()
    const existing = this.memoryStore.get(key)

    if (!existing || now > existing.resetTime) {
      const info = { count: 1, resetTime }
      this.memoryStore.set(key, info)
      return info
    }

    existing.count++
    return existing
  }

  cleanup(): void {
    // Clean up expired entries from memory store
    const now = Date.now()
    for (const [key, info] of this.memoryStore.entries()) {
      if (now > info.resetTime) {
        this.memoryStore.delete(key)
      }
    }
  }
}

const rateLimiter = new RateLimiter()

// Clean up memory store every 5 minutes
setInterval(() => rateLimiter.cleanup(), 5 * 60 * 1000)

export function createRateLimit(config: RateLimitConfig) {
  const {
    windowMs,
    maxRequests,
    skipSuccessfulRequests = false,
    skipFailedRequests = false,
    keyGenerator = (req) => req.ip || 'anonymous',
    onLimitReached
  } = config

  return async (req: Request, res: Response, next: NextFunction) => {
    const key = keyGenerator(req)
    
    try {
      const { count, resetTime } = await rateLimiter.increment(key, windowMs)
      
      // Set rate limit headers
      res.set({
        'X-RateLimit-Limit': maxRequests.toString(),
        'X-RateLimit-Remaining': Math.max(0, maxRequests - count).toString(),
        'X-RateLimit-Reset': Math.ceil(resetTime / 1000).toString(),
      })

      if (count > maxRequests) {
        // Call custom handler if provided
        if (onLimitReached) {
          onLimitReached(req, res)
        }

        return res.status(429).json({
          error: 'Too Many Requests',
          code: 'RATE_LIMIT_EXCEEDED',
          retryAfter: Math.ceil((resetTime - Date.now()) / 1000),
          limit: maxRequests,
          windowMs
        })
      }

      // Skip counting for certain responses if configured
      if (skipSuccessfulRequests || skipFailedRequests) {
        const originalSend = res.send
        res.send = function(body) {
          const statusCode = res.statusCode
          const shouldSkip = 
            (skipSuccessfulRequests && statusCode < 400) ||
            (skipFailedRequests && statusCode >= 400)
          
          // Note: In a real implementation, you'd need to decrement the count
          // This is a simplified version
          
          return originalSend.call(this, body)
        }
      }

      next()
    } catch (error) {
      console.error('Rate limiting error:', error)
      // Fail open - don't block requests if rate limiter fails
      next()
    }
  }
}

// Predefined rate limiters for common scenarios
export const rateLimiters = {
  // General API calls
  api: createRateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 1000,
    keyGenerator: (req) => `api:${req.ip}:${req.user?.id || 'anonymous'}`
  }),

  // Authentication endpoints
  auth: createRateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5,
    keyGenerator: (req) => `auth:${req.ip}:${req.body?.email || 'anonymous'}`,
    onLimitReached: (req, res) => {
      console.warn(`Authentication rate limit exceeded for IP: ${req.ip}, email: ${req.body?.email}`)
    }
  }),

  // Password reset
  passwordReset: createRateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 3,
    keyGenerator: (req) => `password_reset:${req.ip}:${req.body?.email || 'anonymous'}`
  }),

  // File uploads
  upload: createRateLimit({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 10,
    keyGenerator: (req) => `upload:${req.ip}:${req.user?.id || 'anonymous'}`
  }),

  // Search endpoints
  search: createRateLimit({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 60,
    keyGenerator: (req) => `search:${req.ip}:${req.user?.id || 'anonymous'}`
  }),

  // Webhook endpoints
  webhook: createRateLimit({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 100,
    keyGenerator: (req) => `webhook:${req.ip}:${req.get('User-Agent') || 'unknown'}`
  }),

  // Admin endpoints (stricter)
  admin: createRateLimit({
    windowMs: 5 * 60 * 1000, // 5 minutes
    maxRequests: 50,
    keyGenerator: (req) => `admin:${req.ip}:${req.user?.id || 'anonymous'}`
  }),

  // Marketplace creation/updates
  marketplace: createRateLimit({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 10,
    keyGenerator: (req) => `marketplace:${req.user?.id || req.ip}`
  })
}

// Middleware to track suspicious activity
export function trackSuspiciousActivity(req: Request, res: Response, next: NextFunction) {
  const suspiciousPatterns = [
    /\.(php|asp|jsp|cgi)$/i,
    /wp-admin|wp-login|wp-content/i,
    /\.\./,
    /script|<|>/i,
    /union|select|insert|delete|drop|create/i
  ]

  const path = req.path.toLowerCase()
  const userAgent = req.get('User-Agent') || ''
  const referer = req.get('Referer') || ''

  let suspiciousScore = 0

  // Check for suspicious patterns in URL
  suspiciousPatterns.forEach(pattern => {
    if (pattern.test(path)) suspiciousScore += 10
  })

  // Check for missing or suspicious User-Agent
  if (!userAgent || userAgent.length < 10) suspiciousScore += 5
  if (/bot|crawler|scanner/i.test(userAgent)) suspiciousScore += 3

  // Check for suspicious query parameters
  const queryString = req.url?.split('?')[1] || ''
  suspiciousPatterns.forEach(pattern => {
    if (pattern.test(queryString)) suspiciousScore += 8
  })

  // Log suspicious activity
  if (suspiciousScore > 15) {
    console.warn('Suspicious activity detected', {
      ip: req.ip,
      path: req.path,
      userAgent,
      referer,
      score: suspiciousScore,
      timestamp: new Date().toISOString()
    })

    // You could integrate with external services here
    // e.g., report to security monitoring, update firewall rules, etc.
  }

  next()
}

// IP-based blocking middleware
const blockedIPs = new Set<string>()
const suspiciousIPs = new Map<string, { count: number, lastSeen: number }>()

export function ipSecurityCheck(req: Request, res: Response, next: NextFunction) {
  const clientIP = req.ip

  // Check if IP is blocked
  if (blockedIPs.has(clientIP)) {
    return res.status(403).json({
      error: 'Access Denied',
      code: 'IP_BLOCKED'
    })
  }

  // Track suspicious IPs
  const now = Date.now()
  const suspicious = suspiciousIPs.get(clientIP)
  
  if (suspicious) {
    // If IP has been suspicious recently
    if (now - suspicious.lastSeen < 60 * 60 * 1000) { // 1 hour
      suspicious.count++
      suspicious.lastSeen = now
      
      // Block IP if too many suspicious requests
      if (suspicious.count > 50) {
        blockedIPs.add(clientIP)
        console.warn(`IP blocked due to suspicious activity: ${clientIP}`)
        
        return res.status(403).json({
          error: 'Access Denied',
          code: 'IP_BLOCKED'
        })
      }
    } else {
      // Reset counter if enough time has passed
      suspicious.count = 1
      suspicious.lastSeen = now
    }
  }

  next()
}

// Clean up tracking maps periodically
setInterval(() => {
  const now = Date.now()
  const oneHourAgo = now - 60 * 60 * 1000
  
  for (const [ip, data] of suspiciousIPs.entries()) {
    if (data.lastSeen < oneHourAgo) {
      suspiciousIPs.delete(ip)
    }
  }
}, 15 * 60 * 1000) // Clean up every 15 minutes